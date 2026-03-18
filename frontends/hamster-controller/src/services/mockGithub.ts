import type { WorkflowRun } from '../types/github';
import { WORKFLOW_DURATION_MIN, COOLDOWN_MIN, ACTIVE_RUNTIME_MIN, MAX_SESSIONS_PER_DAY } from '../config/infraConfig';

/**
 * Init 결과 - GitHub Actions 이력 기반 상태 판단
 */
export interface InitResult {
  /** 현재 상태 */
  status: 'running' | 'cooldown' | 'available' | 'limit_exceeded';
  /** 오늘 총 실행 횟수 */
  sessionsUsedToday: number;
  /** 일일 최대 횟수 */
  maxSessionsPerDay: number;
  /** 워크플로우 전체 라이프타임(분) — 실제 가동 시간은 workflowDurationMin - cooldownMin */
  workflowDurationMin: number;
  /** 쿨다운 시간(분) */
  cooldownMin: number;
  /** running일 때: 세션 시작 시각 (ISO) */
  sessionStartedAt?: string;
  /** running일 때: 남은 런타임 초 */
  remainingSeconds?: number;
  /** running일 때: 경과 초 */
  elapsedSeconds?: number;
  /** cooldown일 때: 쿨다운 남은 초 */
  cooldownRemainingSeconds?: number;
  /** running일 때: 로그 기반 감지된 세부 단계 */
  detectedPhase?: 'applying' | 'running' | 'destroying';
  /** running일 때: 활성 워크플로우 run ID */
  activeRunId?: number;
  /** 오늘 워크플로우 실행 이력 */
  runs: WorkflowRun[];
}

/**
 * 목 데이터 - 랜덤 케이스 생성
 * 새로고침할 때마다 다른 케이스가 나옴
 */
export function mockInit(): Promise<InitResult> {
  return new Promise((resolve) => {
    // 약간의 지연으로 API 호출 시뮬레이션
    setTimeout(() => {
      const caseIndex = Math.floor(Math.random() * 4);
      resolve(generateCase(caseIndex));
    }, 800);
  });
}

function generateCase(caseIndex: number): InitResult {
  const now = new Date();

  switch (caseIndex) {
    // Case A: 현재 가동중 (startTime이 runtime 이내)
    case 0: {
      const elapsedMin = Math.floor(Math.random() * ACTIVE_RUNTIME_MIN); // 0~active분 경과
      const sessionStartedAt = new Date(now.getTime() - elapsedMin * 60 * 1000);
      const elapsedSeconds = elapsedMin * 60;
      const remainingSeconds = (ACTIVE_RUNTIME_MIN * 60) - elapsedSeconds;
      const sessionsUsedToday = Math.floor(Math.random() * 3) + 1; // 1~3

      return {
        status: 'running',
        sessionsUsedToday,
        maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
        workflowDurationMin: WORKFLOW_DURATION_MIN,
        cooldownMin: COOLDOWN_MIN,
        sessionStartedAt: sessionStartedAt.toISOString(),
        remainingSeconds,
        elapsedSeconds,
        runs: generateRuns(sessionsUsedToday, now, sessionStartedAt),
      };
    }

    // Case B: 쿨다운 중 (runtime 지났지만 +5분 이내)
    case 1: {
      const cooldownElapsedMin = Math.floor(Math.random() * COOLDOWN_MIN); // 0~4분 경과
      const sessionStartedAt = new Date(
        now.getTime() - (WORKFLOW_DURATION_MIN + cooldownElapsedMin) * 60 * 1000
      );
      const cooldownRemainingSeconds = (COOLDOWN_MIN - cooldownElapsedMin) * 60;
      const sessionsUsedToday = Math.floor(Math.random() * 3) + 1;

      return {
        status: 'cooldown',
        sessionsUsedToday,
        maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
        workflowDurationMin: WORKFLOW_DURATION_MIN,
        cooldownMin: COOLDOWN_MIN,
        sessionStartedAt: sessionStartedAt.toISOString(),
        cooldownRemainingSeconds,
        runs: generateRuns(sessionsUsedToday, now, sessionStartedAt),
      };
    }

    // Case C: 실행 가능 (오늘 N회 사용, 한도 이내)
    case 2: {
      const sessionsUsedToday = Math.floor(Math.random() * (MAX_SESSIONS_PER_DAY - 1)); // 0~4

      return {
        status: 'available',
        sessionsUsedToday,
        maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
        workflowDurationMin: WORKFLOW_DURATION_MIN,
        cooldownMin: COOLDOWN_MIN,
        runs: generateRuns(sessionsUsedToday, now),
      };
    }

    // Case D: 한도 초과
    case 3: {
      return {
        status: 'limit_exceeded',
        sessionsUsedToday: MAX_SESSIONS_PER_DAY,
        maxSessionsPerDay: MAX_SESSIONS_PER_DAY,
        workflowDurationMin: WORKFLOW_DURATION_MIN,
        cooldownMin: COOLDOWN_MIN,
        runs: generateRuns(MAX_SESSIONS_PER_DAY, now),
      };
    }

    default:
      return generateCase(2);
  }
}

/**
 * 오늘 실행 이력 목 데이터 생성
 */
function generateRuns(
  count: number,
  now: Date,
  activeStartedAt?: Date,
): WorkflowRun[] {
  const runs: WorkflowRun[] = [];
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const isActive = activeStartedAt && i === count - 1;
    const startTime = isActive
      ? activeStartedAt
      : new Date(todayStart.getTime() + (i + 1) * 60 * 60 * 1000); // 매 시간 간격

    runs.push({
      id: 10000 + i,
      name: 'Terraform Apply',
      status: isActive ? 'in_progress' : 'completed',
      conclusion: isActive ? null : 'success',
      created_at: startTime.toISOString(),
      updated_at: isActive ? now.toISOString() : new Date(startTime.getTime() + WORKFLOW_DURATION_MIN * 60 * 1000).toISOString(),
      run_started_at: startTime.toISOString(),
    });
  }

  return runs.reverse(); // 최신순
}
