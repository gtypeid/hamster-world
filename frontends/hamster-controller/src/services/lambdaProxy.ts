/**
 * Lambda Proxy Client
 *
 * AWS Lambda Function URL을 통해 GitHub API에 접근한다.
 * Lambda는 PAT 토큰을 보관하는 순수 프록시 역할만 수행.
 */

// 개발: Vite 프록시 (/lambda → Lambda Function URL), CORS 우회
// 프로덕션: Lambda Function URL 직접 호출 (CORS 설정 필요)
const LAMBDA_URL = import.meta.env.DEV ? '/lambda' : (import.meta.env.VITE_LAMBDA_URL || '');

interface ProxyRequest {
  method: 'GET' | 'POST';
  path: string;
  params?: Record<string, string>;
  body?: unknown;
}

/**
 * Lambda 프록시를 통해 GitHub API 호출
 */
export async function proxyFetch<T = unknown>(req: ProxyRequest): Promise<T> {
  if (!LAMBDA_URL) {
    throw new Error('VITE_LAMBDA_URL is not configured');
  }

  const res = await fetch(`${LAMBDA_URL}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (res.status === 204) {
    return { ok: true } as T;
  }

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
