// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hamster Controller - GitHub API Proxy (AWS Lambda)
//
// 역할: GitHub PAT를 서버측에 보관하고 API 요청을 중계.
// 비즈니스 로직(상태 판단, 세션 관리)은 프론트엔드가 담당.
// 이 Lambda는 순수 프록시 + CORS 처리만 수행.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GITHUB_API     = 'https://api.github.com';
const PAT            = process.env.GITHUB_PAT;
const OWNER          = process.env.GITHUB_OWNER;
const REPO           = process.env.GITHUB_REPO || 'hamster-world';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// ── 세션 제한 (과금 방어) ──
const MAX_SESSIONS_PER_DAY = 5;
const WORKFLOW_APPLY = 'terraform-apply.yml';

// ── 허용된 GitHub API 경로 패턴 (화이트리스트) ──
const ALLOWED_PATTERNS = [
  /^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/[^/]+\/runs/,   // GET workflow runs
  /^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/[^/]+\/dispatches/, // POST trigger
  /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/\d+$/,               // GET run detail
  /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/\d+\/cancel$/,       // POST cancel
  /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/\d+\/jobs$/,         // GET run jobs
  /^\/repos\/[^/]+\/[^/]+\/actions\/jobs\/\d+\/logs$/,         // GET job logs
  /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/\d+\/logs$/,         // GET run logs
  /^\/repos\/[^/]+\/[^/]+\/actions\/variables\/[A-Z_]+$/,      // GET/PATCH repo variable
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function handler(event) {
  // CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return respond(204);
  }

  const method = event.requestContext?.http?.method || 'GET';

  // 프론트엔드가 보내는 요청 형태:
  //   POST /proxy  { method: 'GET', path: '/repos/.../actions/runs', params: {...} }
  //   POST /proxy  { method: 'POST', path: '/repos/.../dispatches', body: {...} }

  if (event.rawPath !== '/proxy' || method !== 'POST') {
    return respond(404, { error: 'Use POST /proxy' });
  }

  try {
    const req = JSON.parse(event.body || '{}');
    return await proxyToGitHub(req);
  } catch (err) {
    console.error('Proxy error:', err);
    return respond(500, { error: err.message });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Proxy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function proxyToGitHub({ method = 'GET', path, params, body }) {
  if (!path) {
    return respond(400, { error: 'path is required' });
  }

  // 화이트리스트 검증: 허용된 GitHub API 경로만 프록시
  if (!ALLOWED_PATTERNS.some((re) => re.test(path))) {
    return respond(403, { error: 'Path not allowed' });
  }

  // owner/repo 강제 치환 (다른 레포 접근 방지)
  const safePath = path.replace(
    /^\/repos\/[^/]+\/[^/]+\//,
    `/repos/${OWNER}/${REPO}/`
  );

  // ── 과금 방어: terraform-apply 트리거 시 일일 세션 횟수 제한 ──
  if (method === 'POST' && safePath.includes(`/workflows/${WORKFLOW_APPLY}/dispatches`)) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const runsUrl = new URL(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_APPLY}/runs`
    );
    runsUrl.searchParams.set('created', `>=${todayStart.toISOString()}`);
    runsUrl.searchParams.set('per_page', '20');

    const runsRes = await fetch(runsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${PAT}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'hamster-controller-proxy',
      },
    });

    if (runsRes.ok) {
      const runsData = await runsRes.json();
      if ((runsData.workflow_runs || []).length >= MAX_SESSIONS_PER_DAY) {
        return respond(429, {
          error: 'Daily session limit reached',
          limit: MAX_SESSIONS_PER_DAY,
          used: runsData.workflow_runs.length,
        });
      }
    }
  }

  // URL 구성
  const url = new URL(`${GITHUB_API}${safePath}`);
  if (params && method === 'GET') {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  // GitHub API 호출
  const headers = {
    Authorization: `Bearer ${PAT}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'hamster-controller-proxy',
  };

  const fetchOpts = { method, headers };

  if (body && (method === 'POST' || method === 'PATCH')) {
    fetchOpts.headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(body);
  }

  // 로그 API는 redirect 후 plain text를 반환 → 경로 기반으로 강제 text 처리
  const isLogsEndpoint = /\/logs$/.test(safePath);

  const res = await fetch(url.toString(), fetchOpts);

  // 로그 다운로드 등 텍스트 응답
  const contentType = res.headers.get('content-type') || '';
  if (isLogsEndpoint || contentType.includes('text/') || contentType.includes('application/zip')) {
    const text = await res.text();
    return respond(res.status, { raw: text });
  }

  // JSON 응답 (대부분의 경우)
  if (res.status === 204) {
    return respond(204, { ok: true });
  }

  const data = await res.json().catch(() => ({}));
  return respond(res.status, data);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Response helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function respond(statusCode, body = null) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: body ? JSON.stringify(body) : undefined,
  };
}
