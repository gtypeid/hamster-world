/**
 * Terraform Apply 워크플로우 로그 통합 파서
 *
 * GitHub Actions job logs에서 워크플로우 전체 라이프사이클을 파싱한다.
 * Apply → Sleep(Running) → Destroy 각 단계를 식별한다.
 *
 * 로그 패턴:
 *   [Apply 단계]
 *     aws_instance.front: Creating...
 *     aws_instance.front: Creation complete after 45s [id=i-xxx]
 *     Apply complete! Resources: 13 added, 0 changed, 0 destroyed.
 *
 *   [Sleep/Running 단계]
 *     Session started. Active runtime: 2 minutes (total 5, cooldown 3)
 *
 *   [Destroy 단계]
 *     aws_instance.front: Destroying... [id=i-xxx]
 *     aws_instance.front: Still destroying... [id=i-xxx, 10s elapsed]
 *     aws_instance.front: Destruction complete after 15s
 *     Destroy complete! Resources: 25 destroyed.
 */

import type { InstanceId } from '../stores/useInfraStore';

// ─── Terraform 리소스명 → InstanceId 매핑 ───

const TF_TO_INSTANCE: Record<string, InstanceId> = {
  'db':       'hamster-db',
  'auth':     'hamster-auth',
  'kafka':    'hamster-kafka',
  'commerce': 'hamster-commerce',
  'billing':  'hamster-billing',
  'payment':  'hamster-payment',
  'support':  'hamster-support',
  'front':    'hamster-front',
};

// ─── Types ───

/** 워크플로우의 현재 감지된 단계 */
export type WorkflowPhase = 'applying' | 'running' | 'destroying' | 'completed' | 'unknown';

export type ResourceStatus = 'creating' | 'created' | 'destroying' | 'destroyed';

export interface ResourceState {
  instanceId: InstanceId;
  tfName: string;           // e.g. "aws_instance.front"
  status: ResourceStatus;
  elapsed?: string;         // e.g. "45s", "15s"
}

export interface WorkflowLogResult {
  /** 감지된 현재 단계 */
  phase: WorkflowPhase;

  /** Apply 단계 정보 */
  apply: {
    /** Apply complete 감지 여부 */
    complete: boolean;
    /** "Resources: X added, Y changed, Z destroyed" */
    summary: string | null;
  };

  /** Destroy 단계 정보 */
  destroy: {
    /** Destroy 시작 감지 여부 (첫 Destroying... 패턴) */
    started: boolean;
    /** Destroy complete 감지 여부 */
    complete: boolean;
    /** 전체 파괴된 리소스 수 */
    totalDestroyed: number | null;
  };

  /** 리소스별 상태 (apply creating/created + destroy destroying/destroyed) */
  resources: ResourceState[];
}

// ─── Parser ───

/**
 * 워크플로우 job logs 전체를 파싱하여 현재 상태를 반환한다.
 * 매 폴링마다 전체 로그를 파싱하는 방식 (idempotent).
 */
export function parseWorkflowLog(raw: string | null): WorkflowLogResult {
  const result: WorkflowLogResult = {
    phase: 'unknown',
    apply: { complete: false, summary: null },
    destroy: { started: false, complete: false, totalDestroyed: null },
    resources: [],
  };

  if (!raw) return result;

  const resourceMap = new Map<string, ResourceState>();

  // ─── Apply 패턴 ───

  // Creating...
  const creatingRegex = /aws_instance\.(\w+):\s+Creating\.\.\./g;
  let match: RegExpExecArray | null;

  while ((match = creatingRegex.exec(raw)) !== null) {
    const name = match[1];
    const instanceId = TF_TO_INSTANCE[name];
    if (instanceId) {
      resourceMap.set(`create-${name}`, {
        instanceId,
        tfName: `aws_instance.${name}`,
        status: 'creating',
      });
    }
  }

  // Creation complete after Xs
  const createdRegex = /aws_instance\.(\w+):\s+Creation complete after\s+(\S+)/g;

  while ((match = createdRegex.exec(raw)) !== null) {
    const name = match[1];
    const elapsed = match[2];
    const instanceId = TF_TO_INSTANCE[name];
    if (instanceId) {
      resourceMap.set(`create-${name}`, {
        instanceId,
        tfName: `aws_instance.${name}`,
        status: 'created',
        elapsed,
      });
    }
  }

  // Apply complete!
  const applyMatch = raw.match(/Apply complete!\s+Resources:\s+(.+?)\./);
  if (applyMatch) {
    result.apply.complete = true;
    result.apply.summary = applyMatch[1];
  }

  // ─── Destroy 패턴 ───

  // Destroying...
  const destroyingRegex = /aws_instance\.(\w+):\s+Destroying\.\.\./g;

  while ((match = destroyingRegex.exec(raw)) !== null) {
    const name = match[1];
    const instanceId = TF_TO_INSTANCE[name];
    if (instanceId) {
      result.destroy.started = true;
      resourceMap.set(`destroy-${name}`, {
        instanceId,
        tfName: `aws_instance.${name}`,
        status: 'destroying',
      });
    }
  }

  // Destruction complete after Xs
  const destroyedRegex = /aws_instance\.(\w+):\s+Destruction complete after\s+(\S+)/g;

  while ((match = destroyedRegex.exec(raw)) !== null) {
    const name = match[1];
    const elapsed = match[2];
    const instanceId = TF_TO_INSTANCE[name];
    if (instanceId) {
      result.destroy.started = true;
      resourceMap.set(`destroy-${name}`, {
        instanceId,
        tfName: `aws_instance.${name}`,
        status: 'destroyed',
        elapsed,
      });
    }
  }

  // Destroy complete!
  const destroyMatch = raw.match(/Destroy complete!\s+Resources:\s+(\d+)\s+destroyed/);
  if (destroyMatch) {
    result.destroy.complete = true;
    result.destroy.totalDestroyed = parseInt(destroyMatch[1], 10);
  }

  // ─── Phase 판정 ───

  if (result.destroy.complete) {
    result.phase = 'completed';
  } else if (result.destroy.started) {
    result.phase = 'destroying';
  } else if (result.apply.complete) {
    result.phase = 'running';  // apply 끝 + destroy 아직 → sleep(running) 구간
  } else {
    // Creating 패턴이 있으면 applying, 아니면 unknown
    const hasCreating = Array.from(resourceMap.values()).some(
      (r) => r.status === 'creating' || r.status === 'created'
    );
    result.phase = hasCreating ? 'applying' : 'unknown';
  }

  result.resources = Array.from(resourceMap.values());
  return result;
}

/**
 * terraform 리소스 short name → InstanceId 변환
 */
export function tfNameToInstanceId(tfShortName: string): InstanceId | null {
  return TF_TO_INSTANCE[tfShortName] ?? null;
}
