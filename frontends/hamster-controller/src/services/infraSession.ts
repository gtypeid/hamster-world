/**
 * Infrastructure Session Service
 *
 * GitHub Actions 워크플로우 데이터를 기반으로 인프라 세션 상태를 판단한다.
 * 모든 API 호출은 Lambda 프록시를 통해 수행.
 * 비즈니스 로직(상태 분석)은 전부 여기(프론트엔드)에 있다.
 */

import { proxyFetch } from './lambdaProxy';
import type { InitResult } from './mockGithub';
import type { WorkflowRun, WorkflowRunsResponse } from '../types/github';
import { useInfraStore } from '../stores/useInfraStore';
import { WORKFLOW_DURATION_MIN, COOLDOWN_MIN, ACTIVE_RUNTIME_MIN, MAX_SESSIONS_PER_DAY } from '../config/infraConfig';
import { parseWorkflowLog } from '../utils/parseWorkflowLog';

const OWNER = import.meta.env.VITE_GITHUB_OWNER || 'gtypeid';
const REPO  = import.meta.env.VITE_GITHUB_REPO  || 'hamster-world';
const WORKFLOW_APPLY = 'terraform-apply.yml';
const WORKFLOW_PLAN  = 'terraform-plan.yml';

// ─── Connect: 현재 상태 판단 ───

export async function fetchInfraStatus(): Promise<InitResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const data = await proxyFetch<WorkflowRunsResponse>({
    method: 'GET',
    path: `/repos/_/_/actions/workflows/${WORKFLOW_APPLY}/runs`,
    params: {
      per_page: '20',
      created: `>=${todayStart.toISOString()}`,
    },
  });

  const runs: WorkflowRun[] = (data.workflow_runs || []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    created_at: r.created_at,
    updated_at: r.updated_at,
    run_started_at: r.run_started_at,
  }));

  const result = analyzeStatus(runs);

  // active run이 있으면 로그를 가져와서 세부 단계 감지
  if (result.status === 'running' && result.activeRunId) {
    try {
      const logs = await fetchRunLogs(result.activeRunId);
      const parsed = parseWorkflowLog(logs);
      if (parsed.phase === 'applying' || parsed.phase === 'running' || parsed.phase === 'destroying') {
        result.detectedPhase = parsed.phase;
      }
    } catch {
      // 로그 가져오기 실패해도 기본 running으로 진행
    }
  }

  return result;
}

/**
 * 워크플로우 실행 이력으로 현재 상태를 분석
 */
function analyzeStatus(runs: WorkflowRun[]): InitResult {
  const now = new Date();
  const sessionsUsedToday = runs.length;

  // 현재 진행중인 런 (queued 또는 in_progress)
  const activeRun = runs.find(
    (r) => r.status === 'queued' || r.status === 'in_progress'
  );

  if (activeRun) {
    const startedAt = new Date(activeRun.run_started_at || activeRun.created_at);
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const activeSeconds = ACTIVE_RUNTIME_MIN * 60;
    const remainingSeconds = Math.max(activeSeconds - elapsedSeconds, 0);

    return {
      status: 'running',
      sessionsUsedToday,
      maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
      workflowDurationMin: WORKFLOW_DURATION_MIN,
      cooldownMin: COOLDOWN_MIN,
      sessionStartedAt: startedAt.toISOString(),
      elapsedSeconds,
      remainingSeconds,
      activeRunId: activeRun.id,
      runs,
    };
  }

  // 가장 최근 완료된 런
  const latestCompleted = runs.find((r) => r.status === 'completed');

  if (latestCompleted) {
    const completedAt = new Date(latestCompleted.updated_at);
    const sinceCompletedMs = now.getTime() - completedAt.getTime();
    const cooldownTotalMs = COOLDOWN_MIN * 60 * 1000;

    if (sinceCompletedMs < cooldownTotalMs) {
      const cooldownRemainingSeconds = Math.ceil(
        (cooldownTotalMs - sinceCompletedMs) / 1000
      );

      return {
        status: 'cooldown',
        sessionsUsedToday,
        maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
        workflowDurationMin: WORKFLOW_DURATION_MIN,
        cooldownMin: COOLDOWN_MIN,
        sessionStartedAt: latestCompleted.run_started_at,
        cooldownRemainingSeconds,
        runs,
      };
    }
  }

  // 한도 초과 체크
  if (sessionsUsedToday >= MAX_SESSIONS_PER_DAY) {
    return {
      status: 'limit_exceeded',
      sessionsUsedToday,
      maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
      workflowDurationMin: WORKFLOW_DURATION_MIN,
      cooldownMin: COOLDOWN_MIN,
      runs,
    };
  }

  // 실행 가능
  return {
    status: 'available',
    sessionsUsedToday,
    maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
    workflowDurationMin: WORKFLOW_DURATION_MIN,
    cooldownMin: COOLDOWN_MIN,
    runs,
  };
}

// ─── Init: Terraform Plan 트리거 + 결과 대기 ───

export type ProgressCallback = (message: string, level?: 'info' | 'success' | 'warn') => void;

export interface PlanResult {
  logs: string;
  runId: number;
  runUrl: string;
}

export async function triggerPlan(onProgress?: ProgressCallback): Promise<PlanResult> {
  const log = onProgress || (() => {});
  const { setPlanStep } = useInfraStore.getState();

  // Step 0: Dispatch
  setPlanStep(0, 'Workflow Dispatch');
  log('terraform-plan.yml workflow_dispatch 전송 중...');
  await proxyFetch({
    method: 'POST',
    path: `/repos/_/_/actions/workflows/${WORKFLOW_PLAN}/dispatches`,
    body: { ref: 'main' },
  });
  log('디스패치 완료 - GitHub에서 run 생성 대기 중...', 'success');

  await sleep(3000);

  // Step 1: Waiting for run
  setPlanStep(1, 'Run 생성 대기');
  log('워크플로우 run 검색 중...');
  const run = await waitForRun(WORKFLOW_PLAN, 60_000, (attempt) => {
    if (attempt > 1) log(`run 생성 대기 중... (시도 ${attempt})`);
  });

  if (!run) {
    throw new Error('Plan workflow run not found');
  }

  const runUrl = `https://github.com/${OWNER}/${REPO}/actions/runs/${run.id}`;
  log(`Run #${run.id} 발견 (상태: ${run.status})`, 'success');

  // Step 2: Running (poll until done)
  setPlanStep(2, 'Plan 실행 중');
  log('Terraform plan 완료 대기 중...');
  const completedRun = await pollRunUntilDone(run.id, 120_000, (status, elapsed) => {
    log(`Plan 실행 중... ${elapsed}초 경과 (상태: ${status})`);
  });

  if (completedRun.conclusion !== 'success') {
    throw new Error(`Plan 실패: ${completedRun.conclusion}`);
  }

  log('Terraform plan 성공', 'success');

  // Step 3: Fetching logs
  setPlanStep(3, '결과 수집');
  log('Plan 출력 로그 가져오는 중...');
  const logs = await fetchRunLogs(completedRun.id);
  log('Plan 결과 수집 완료', 'success');

  // Done
  setPlanStep(4, '완료');

  return {
    logs: logs || 'Plan 성공 (로그 수집 불가)',
    runId: run.id,
    runUrl,
  };
}

// ─── Start: Terraform Apply 트리거 ───

export async function triggerApply(): Promise<number> {
  await proxyFetch({
    method: 'POST',
    path: `/repos/_/_/actions/workflows/${WORKFLOW_APPLY}/dispatches`,
    body: { ref: 'main', inputs: { duration: String(WORKFLOW_DURATION_MIN), cooldown: String(COOLDOWN_MIN) } },
  });

  await sleep(3000);

  const run = await waitForRun(WORKFLOW_APPLY, 60_000);
  if (!run) {
    throw new Error('Apply workflow run not found');
  }

  return run.id;
}

// ─── Stop: 실행중인 워크플로우 취소 ───

export async function cancelRun(runId: number): Promise<void> {
  await proxyFetch({
    method: 'POST',
    path: `/repos/_/_/actions/runs/${runId}/cancel`,
  });
}

// ─── Poll: 워크플로우 런 상태 폴링 ───

export async function getRunStatus(runId: number): Promise<WorkflowRun> {
  const data = await proxyFetch<WorkflowRun>({
    method: 'GET',
    path: `/repos/_/_/actions/runs/${runId}`,
  });
  return data;
}

// ─── Helpers ───

async function waitForRun(
  workflowFile: string,
  timeoutMs: number,
  onAttempt?: (attempt: number) => void,
): Promise<WorkflowRun | null> {
  const deadline = Date.now() + timeoutMs;
  const beforeTime = new Date(Date.now() - 10_000).toISOString();
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    onAttempt?.(attempt);

    const data = await proxyFetch<WorkflowRunsResponse>({
      method: 'GET',
      path: `/repos/_/_/actions/workflows/${workflowFile}/runs`,
      params: { per_page: '5', created: `>=${beforeTime}` },
    });

    const recent = (data.workflow_runs || []).find(
      (r) => r.status === 'queued' || r.status === 'in_progress'
    );

    if (recent) return recent;

    await sleep(3000);
  }

  return null;
}

async function pollRunUntilDone(
  runId: number,
  timeoutMs: number,
  onPoll?: (status: string, elapsedSec: number) => void,
): Promise<WorkflowRun> {
  const deadline = Date.now() + timeoutMs;
  const startTime = Date.now();

  while (Date.now() < deadline) {
    const run = await getRunStatus(runId);
    if (run.status === 'completed') return run;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onPoll?.(run.status, elapsed);

    await sleep(5000);
  }

  throw new Error('Workflow run timed out');
}

/**
 * 워크플로우 런의 로그를 plain text로 가져온다.
 *
 * /runs/{id}/logs 는 ZIP 바이너리를 반환하므로 사용하지 않는다.
 * 대신 /runs/{id}/jobs → /jobs/{jobId}/logs 경로를 사용하면
 * GitHub가 plain text 로그를 반환한다.
 */
export async function fetchRunLogs(runId: number): Promise<string | null> {
  try {
    // 1) 해당 run의 jobs 목록 조회
    const jobsData = await proxyFetch<{ jobs?: Array<{ id: number; status: string }> }>({
      method: 'GET',
      path: `/repos/_/_/actions/runs/${runId}/jobs`,
    });

    const jobs = jobsData.jobs || [];
    if (jobs.length === 0) return null;

    // 첫 번째 job (terraform plan은 single-job workflow)
    const jobId = jobs[0].id;

    // 2) job 로그를 plain text로 가져오기
    const logData = await proxyFetch<{ raw?: string }>({
      method: 'GET',
      path: `/repos/_/_/actions/jobs/${jobId}/logs`,
    });

    return logData.raw || null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
