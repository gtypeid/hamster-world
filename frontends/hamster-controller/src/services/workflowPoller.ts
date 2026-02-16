/**
 * Workflow Lifecycle Poller
 *
 * terraform-apply 워크플로우의 전체 라이프사이클을 job logs 기반으로 폴링한다.
 *
 * 흐름:
 *   1. handleStart → startWorkflowPolling(runId) 호출
 *   2. 5초마다 fetchRunLogs → parseWorkflowLog
 *   3. 파싱 결과에 따라 phase 전환:
 *      - applying: 인스턴스 creating/created 업데이트
 *      - running:  "Apply complete!" 감지 → phase='running', 인스턴스 all running
 *      - destroying: "Destroying..." 감지 → phase='destroying', 인스턴스별 추적
 *      - completed: "Destroy complete!" → endSession
 *   4. workflow completed fallback (로그 파싱 실패 대비)
 *
 * Connect으로 기존 세션 참여 시에도 사용 가능:
 *   resumeWorkflowPolling(runId, initialPhase) → 현재 단계부터 폴링 시작
 */

import { fetchRunLogs, getRunStatus } from './infraSession';
import { parseWorkflowLog } from '../utils/parseWorkflowLog';
import type { WorkflowPhase, ResourceState } from '../utils/parseWorkflowLog';
import { useInfraStore, INSTANCE_IDS } from '../stores/useInfraStore';
import { WORKFLOW_DURATION_MIN } from '../config/infraConfig';

const POLL_INTERVAL = 5_000; // 5초
/** WORKFLOW_DURATION_MIN + 5분 여유 — 워크플로우가 비정상 지연 시 무한 폴링 방지 */
const POLL_TIMEOUT = (WORKFLOW_DURATION_MIN + 5) * 60_000;

let activePoller: number | null = null;

// 이미 로그를 남긴 이벤트 추적 (중복 방지)
let loggedEvents = new Set<string>();

/**
 * Apply 직후부터 전 과정 폴링 시작
 */
export function startWorkflowPolling(runId: number): void {
  if (activePoller !== null) return;
  loggedEvents = new Set();
  beginPolling(runId);
}

/**
 * Connect으로 기존 세션 참여 시 — 현재 단계부터 폴링 시작
 */
export function resumeWorkflowPolling(runId: number): void {
  if (activePoller !== null) return;
  loggedEvents = new Set();
  beginPolling(runId);
}

/**
 * 폴링 중지
 */
export function stopWorkflowPolling(): void {
  if (activePoller !== null) {
    clearTimeout(activePoller);
    activePoller = null;
  }
  loggedEvents = new Set();
}

// ─── Internal ───

/** 마지막으로 감지된 phase (중복 전환 방지용) */
let lastDetectedPhase: WorkflowPhase = 'unknown';

function beginPolling(runId: number): void {
  lastDetectedPhase = 'unknown';
  const startTime = Date.now();

  const poll = async () => {
    // 타임아웃 체크
    if (Date.now() - startTime > POLL_TIMEOUT) {
      const { addLog } = useInfraStore.getState();
      addLog({ message: '워크플로우 폴링 타임아웃', level: 'error' });
      stopWorkflowPolling();
      return;
    }

    try {
      const logs = await fetchRunLogs(runId);
      const result = parseWorkflowLog(logs);

      // Phase 전환 처리
      handlePhaseTransition(result.phase, runId);

      // 리소스 상태 업데이트
      for (const res of result.resources) {
        applyResourceState(res);
      }

      // 완료 확인
      if (result.destroy.complete) {
        onComplete(result.destroy.totalDestroyed);
        return;
      }

      // workflow status fallback
      const run = await getRunStatus(runId);
      if (run.status === 'completed') {
        onWorkflowCompleted(run.conclusion ?? 'unknown');
        return;
      }
    } catch (err) {
      console.warn('[workflowPoller] poll error:', err);
    }

    activePoller = window.setTimeout(poll, POLL_INTERVAL);
  };

  activePoller = window.setTimeout(poll, POLL_INTERVAL);
}

function handlePhaseTransition(detected: WorkflowPhase, _runId: number): void {
  if (detected === lastDetectedPhase || detected === 'unknown') return;

  const { setSessionPhase, updateInstance, addLog } = useInfraStore.getState();
  const prev = lastDetectedPhase;
  lastDetectedPhase = detected;

  switch (detected) {
    case 'applying': {
      // 이미 applying이면 무시
      if (prev !== 'unknown') return;
      // applying은 handleStart에서 이미 설정하므로 로그만
      if (!loggedEvents.has('apply-start')) {
        loggedEvents.add('apply-start');
        addLog({ message: 'Terraform Apply 진행 중 - 인스턴스 생성 시작', level: 'info' });
      }
      break;
    }

    case 'running': {
      // Apply complete → 모든 인스턴스 running
      if (!loggedEvents.has('apply-complete')) {
        loggedEvents.add('apply-complete');
        for (const id of INSTANCE_IDS) {
          updateInstance(id, { status: 'running' });
        }
        addLog({
          message: `전체 ${INSTANCE_IDS.length}개 인스턴스 온라인 - 인프라 준비 완료`,
          level: 'success',
        });
        setSessionPhase('running');
      }
      break;
    }

    case 'destroying': {
      // Destroy 시작 감지
      if (!loggedEvents.has('destroy-start')) {
        loggedEvents.add('destroy-start');
        setSessionPhase('destroying');
        for (const id of INSTANCE_IDS) {
          updateInstance(id, { status: 'destroying' });
        }
        addLog({ message: 'Terraform destroy 시작 - 리소스 파괴 진행 중', level: 'warn' });
      }
      break;
    }

    // 'completed'는 onComplete에서 처리
  }
}

function applyResourceState(res: ResourceState): void {
  const { updateInstance, addLog } = useInfraStore.getState();
  const key = `${res.status}-${res.instanceId}`;

  switch (res.status) {
    case 'creating':
      updateInstance(res.instanceId, { status: 'provisioning' });
      break;

    case 'created':
      updateInstance(res.instanceId, { status: 'running' });
      if (!loggedEvents.has(key)) {
        loggedEvents.add(key);
        addLog({
          instanceId: res.instanceId,
          message: `${res.tfName} 생성 완료${res.elapsed ? ` (${res.elapsed})` : ''}`,
          level: 'success',
        });
      }
      break;

    case 'destroying':
      updateInstance(res.instanceId, { status: 'destroying' });
      break;

    case 'destroyed':
      updateInstance(res.instanceId, { status: 'idle' });
      if (!loggedEvents.has(key)) {
        loggedEvents.add(key);
        addLog({
          instanceId: res.instanceId,
          message: `${res.tfName} 파괴 완료${res.elapsed ? ` (${res.elapsed})` : ''}`,
          level: 'info',
        });
      }
      break;
  }
}

function onComplete(totalDestroyed: number | null): void {
  const { addLog, resetInstances, endSession } = useInfraStore.getState();
  addLog({
    message: `Destroy complete! ${totalDestroyed ?? '?'}개 리소스 파괴됨`,
    level: 'success',
  });
  resetInstances();
  endSession();
  stopWorkflowPolling();
}

function onWorkflowCompleted(conclusion: string): void {
  const { addLog, resetInstances, endSession } = useInfraStore.getState();
  addLog({
    message: `워크플로우 완료 (${conclusion}) - 세션 종료`,
    level: conclusion === 'success' ? 'success' : 'warn',
  });
  resetInstances();
  endSession();
  stopWorkflowPolling();
}
