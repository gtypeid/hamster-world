/**
 * Workflow Lifecycle Poller
 *
 * terraform-apply 워크플로우의 전체 라이프사이클을 폴링한다.
 *
 * ── 감지 전략 (매 5초 병행) ──
 *
 *   Steps API → phase 감지 (가볍고 안정적)
 *     - "Terraform Apply" step in_progress → phase = applying
 *     - "Wait for active runtime" step in_progress → phase = running
 *     - "Terraform Destroy" step in_progress → phase = destroying
 *     - job completed → phase = completed
 *
 *   Logs API → 리소스별 실시간 상태 업데이트
 *     - aws_instance.{name}: Creating.../Created → 인스턴스별 상태
 *     - aws_instance.{name}: Destroying.../Destroyed → 인스턴스별 상태
 *     - Apply complete! / Destroy complete! → 요약 정보
 *
 * Connect으로 기존 세션 참여 시에도 사용 가능:
 *   resumeWorkflowPolling(runId) → 현재 단계부터 폴링 시작
 */

import { fetchRunJobs, fetchRunLogs } from './infraSession';
import { parseWorkflowLog } from '../utils/parseWorkflowLog';
import type { WorkflowPhase, ResourceState } from '../utils/parseWorkflowLog';
import type { WorkflowJob } from '../types/github';
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
      // ── Steps + Logs 병행 조회 ──
      const [job, logs] = await Promise.all([
        fetchRunJobs(runId),
        fetchRunLogs(runId),
      ]);

      // 1) Steps 기반 phase 감지
      if (job) {
        const phase = detectPhaseFromSteps(job);
        handlePhaseTransition(phase);
      }

      // 2) Logs 기반 리소스별 실시간 업데이트
      if (logs) {
        const result = parseWorkflowLog(logs);

        // phase fallback: steps에서 감지 못했으면 로그 기반으로
        if (lastDetectedPhase === 'unknown' && result.phase !== 'unknown') {
          handlePhaseTransition(result.phase);
        }

        // 리소스 상태 업데이트
        for (const res of result.resources) {
          applyResourceState(res);
        }

        // 완료 확인
        if (result.destroy.complete) {
          onComplete(result.destroy.totalDestroyed);
          return;
        }
      }

      // 3) job completed fallback (로그 파싱에서 완료 못 잡았을 때)
      if (job && job.status === 'completed') {
        onWorkflowCompleted(job.conclusion ?? 'unknown');
        return;
      }
    } catch (err) {
      console.warn('[workflowPoller] poll error:', err);
    }

    activePoller = window.setTimeout(poll, POLL_INTERVAL);
  };

  activePoller = window.setTimeout(poll, POLL_INTERVAL);
}

// ─── Step-based Phase Detection ───

/**
 * GitHub Actions job의 steps 정보를 기반으로 현재 워크플로우 phase를 판정한다.
 *
 * Step 이름은 terraform-apply.yml 워크플로우 파일의 step name과 일치해야 한다:
 *   - "Terraform Apply"
 *   - "Wait for active runtime"
 *   - "Terraform Destroy"
 */
function detectPhaseFromSteps(job: WorkflowJob): WorkflowPhase {
  if (job.status === 'completed') return 'completed';

  const steps = job.steps || [];

  const destroyStep = steps.find((s) => s.name === 'Terraform Destroy');
  const waitStep = steps.find((s) => s.name === 'Wait for active runtime');
  const applyStep = steps.find((s) => s.name === 'Terraform Apply');

  if (destroyStep && (destroyStep.status === 'in_progress' || destroyStep.status === 'completed')) {
    return 'destroying';
  }
  if (waitStep && (waitStep.status === 'in_progress' || waitStep.status === 'completed')) {
    return 'running';
  }
  if (applyStep && (applyStep.status === 'in_progress' || applyStep.status === 'completed')) {
    return 'applying';
  }

  return 'unknown';
}

// ─── Phase Transition Handler ───

function handlePhaseTransition(detected: WorkflowPhase): void {
  if (detected === lastDetectedPhase || detected === 'unknown') return;

  const { setSessionPhase, updateInstance, addLog, setApplyStep } = useInfraStore.getState();
  lastDetectedPhase = detected;

  switch (detected) {
    case 'applying': {
      if (!loggedEvents.has('apply-start')) {
        loggedEvents.add('apply-start');
        setApplyStep(2, 'Terraform Apply');
        setSessionPhase('applying');
        for (const id of INSTANCE_IDS) {
          updateInstance(id, { status: 'provisioning' });
        }
        addLog({ message: 'Terraform Apply 진행 중 - 인스턴스 생성 시작', level: 'info' });
      }
      break;
    }

    case 'running': {
      if (!loggedEvents.has('apply-complete')) {
        loggedEvents.add('apply-complete');
        setApplyStep(3, '인프라 가동 중');
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
      if (!loggedEvents.has('destroy-start')) {
        loggedEvents.add('destroy-start');
        setApplyStep(4, 'Terraform Destroy');
        setSessionPhase('destroying');
        for (const id of INSTANCE_IDS) {
          updateInstance(id, { status: 'destroying' });
        }
        addLog({ message: 'Terraform destroy 시작 - 리소스 파괴 진행 중', level: 'warn' });
      }
      break;
    }
  }
}

// ─── Resource State ───

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

// ─── Completion ───

function onComplete(totalDestroyed: number | null): void {
  const { addLog, resetInstances, endSession, setApplyStep } = useInfraStore.getState();
  setApplyStep(5, '완료');
  addLog({
    message: `Destroy complete! ${totalDestroyed ?? '?'}개 리소스 파괴됨`,
    level: 'success',
  });
  resetInstances();
  endSession();
  stopWorkflowPolling();
}

function onWorkflowCompleted(conclusion: string): void {
  const { addLog, resetInstances, endSession, setApplyStep } = useInfraStore.getState();
  setApplyStep(5, '완료');
  addLog({
    message: `워크플로우 완료 (${conclusion}) - 세션 종료`,
    level: conclusion === 'success' ? 'success' : 'warn',
  });
  resetInstances();
  endSession();
  stopWorkflowPolling();
}
