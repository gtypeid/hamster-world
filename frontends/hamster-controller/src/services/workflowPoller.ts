/**
 * Workflow Lifecycle Poller
 *
 * terraform-apply 워크플로우의 전체 라이프사이클을 폴링한다.
 *
 * ── 변경 이력 ──
 *
 *   [v1] 초기 설계: job logs API 기반 폴링
 *     - 매 5초 GET /jobs/{jobId}/logs → parseWorkflowLog로 phase + 리소스 상태 감지
 *     - 의도: 진행 중인 워크플로우의 terraform 로그를 실시간 파싱하여
 *       인스턴스별 상태(creating/created/destroying/destroyed)를 추적
 *
 *   [v2] 실제 테스트 결과 → 전략 변경
 *
 *     테스트 워크플로우: https://github.com/gtypeid/hamster-world/actions/runs/22052214685
 *     run ID: 22052214685, job ID(deploy): 63712494664
 *
 *     확인 사항:
 *       - GET /runs/22052214685/jobs → 200 OK (in_progress 중에도 steps 포함하여 정상 반환)
 *       - GET /jobs/63712494664/logs → 404 Not Found (in_progress 중)
 *         응답: {"message":"Not Found","documentation_url":"https://docs.github.com/rest/actions/workflow-jobs#download-job-logs-for-a-workflow-run","status":"404"}
 *       - GET /jobs/63712494664/logs → 200 OK (completed 후에는 정상 반환, 378KB)
 *
 *     클라이언트 로그 (KST 15:16~15:28):
 *       15:16:51  "Terraform Apply 진행 중"         ← steps에서 Apply in_progress 감지
 *       15:20:26  "전체 8개 인스턴스 온라인"         ← steps에서 Wait in_progress 감지
 *       15:23:27  "Terraform destroy 시작"           ← steps에서 Destroy in_progress 감지
 *       15:28:32  "aws_instance.* 생성/파괴 완료" x16 ← job completed 후 로그 1회 수신
 *       15:28:32  "Destroy complete! 13개 리소스"    ← 모두 동일 시각에 한꺼번에 수신
 *
 *     결론:
 *       - 워크플로우 run/jobs API(steps 포함)는 진행 중에도 정상 조회 가능
 *       - job logs API는 job completed 이후에만 반환 (GitHub API 제약)
 *       - 따라서 인스턴스별 실시간 상태 추적이 logs 기반으로는 불가능
 *       - GitHub Repository Variables API(INFRA_STATUS)를 통해
 *         워크플로우 sh에서 상태를 push하고 클라이언트가 poll하는 방식으로 변경
 *
 * ── 현재 감지 전략 (매 5초 병행) ──
 *
 *   1. Steps API → phase 감지 (진행 중에도 동작)
 *     - "Terraform Apply" step in_progress → phase = applying
 *     - "Wait for active runtime" step in_progress → phase = running
 *     - "Terraform Destroy" step in_progress → phase = destroying
 *     - job completed → phase = completed
 *
 *   2. Repository Variables API → 인스턴스별 실시간 상태 (워크플로우 sh가 push)
 *     - INFRA_STATUS variable에 JSON으로 인스턴스 상태 기록
 *     - 클라이언트가 poll하여 인스턴스별 상태 반영
 *
 *   3. Logs API → 완료 후 리소스별 상세 정보 (보조)
 *     - job 완료 시 1회 호출하여 elapsed time 등 상세 정보 추출
 *
 * Connect으로 기존 세션 참여 시에도 사용 가능:
 *   resumeWorkflowPolling(runId) → 현재 단계부터 폴링 시작
 */

import { fetchRunJobs, fetchRunLogs, fetchInfraVariable } from './infraSession';
import type { InfraVariableStatus } from './infraSession';
import { parseWorkflowLog } from '../utils/parseWorkflowLog';
import type { WorkflowPhase, ResourceState } from '../utils/parseWorkflowLog';
import type { WorkflowJob } from '../types/github';
import type { InstanceId, InstanceStatus } from '../stores/useInfraStore';
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
      // ── Steps + Variable 병행 조회 ──
      const [job, infraVar] = await Promise.all([
        fetchRunJobs(runId),
        fetchInfraVariable(),
      ]);

      // 1) Steps 기반 phase 감지
      if (job) {
        const phase = detectPhaseFromSteps(job);
        handlePhaseTransition(phase);
      }

      // 2) Repository Variable 기반 인스턴스별 실시간 업데이트
      if (infraVar) {
        applyInfraVariable(infraVar);
      }

      // 3) job 완료 → 로그 1회 가져와서 리소스별 상세 정보 추출 후 종료
      if (job && job.status === 'completed') {
        await handleJobCompleted(runId, job);
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

// ─── Infra Variable → Instance State ───

/**
 * INFRA_STATUS repository variable의 인스턴스별 상태를 스토어에 반영한다.
 * 워크플로우 sh가 PATCH로 업데이트한 JSON을 poll하여 인스턴스 상태를 실시간 반영.
 *
 * variable JSON 형태:
 *   { instances: { "hamster-db": { status: "running", ip: "10.0.1.5" }, ... } }
 */
function applyInfraVariable(infraVar: InfraVariableStatus): void {
  const { updateInstance, addLog } = useInfraStore.getState();

  if (!infraVar.instances) return;

  for (const [id, info] of Object.entries(infraVar.instances)) {
    const instanceId = id as InstanceId;
    if (!INSTANCE_IDS.includes(instanceId)) continue;

    const update: Partial<{ status: InstanceStatus; ip: string; detail: string }> = {};

    // status 매핑: variable의 status → store의 InstanceStatus
    switch (info.status) {
      case 'creating':
      case 'provisioning':
        update.status = 'provisioning';
        break;
      case 'running':
        update.status = 'running';
        break;
      case 'destroying':
        update.status = 'destroying';
        break;
      case 'destroyed':
      case 'idle':
        update.status = 'idle';
        break;
      case 'failed':
        update.status = 'failed';
        break;
    }

    if (info.ip) update.ip = info.ip;
    if (info.detail) update.detail = info.detail;

    if (Object.keys(update).length > 0) {
      updateInstance(instanceId, update);
    }

    // IP 할당 로그 (최초 1회)
    if (info.ip) {
      const ipKey = `ip-${instanceId}`;
      if (!loggedEvents.has(ipKey)) {
        loggedEvents.add(ipKey);
        addLog({
          instanceId,
          message: `IP 할당: ${info.ip}`,
          level: 'info',
        });
      }
    }
  }
}

// ─── Job Completed Handler ───

/**
 * job 완료 시 1회 호출: 로그를 가져와서 리소스별 상세 정보(elapsed time 등)를 추출하고 세션을 종료한다.
 * 로그 가져오기에 실패해도 워크플로우 완료 처리는 진행한다.
 */
async function handleJobCompleted(runId: number, job: WorkflowJob): Promise<void> {
  const conclusion = job.conclusion || 'unknown';

  try {
    const logs = await fetchRunLogs(runId);
    if (logs) {
      const parsed = parseWorkflowLog(logs);

      // 리소스별 상세 정보 적용 (elapsed time 등)
      for (const res of parsed.resources) {
        applyResourceState(res);
      }

      // Destroy complete 감지 시
      if (parsed.destroy.complete) {
        onComplete(parsed.destroy.totalDestroyed);
        return;
      }
    }
  } catch (err) {
    console.warn('[workflowPoller] failed to fetch completion logs:', err);
  }

  // 로그 파싱 실패 또는 destroy complete 미감지 → 워크플로우 자체 완료로 처리
  onWorkflowCompleted(conclusion);
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
