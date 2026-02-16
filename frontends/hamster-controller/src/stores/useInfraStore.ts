import { create } from 'zustand';
import type { InitResult } from '../services/mockGithub';
import { COOLDOWN_MIN, ACTIVE_RUNTIME_MIN, MAX_SESSIONS_PER_DAY } from '../config/infraConfig';

// ─── Instance definitions matching terraform ───

export type InstanceId =
  | 'hamster-db'
  | 'hamster-auth'
  | 'hamster-kafka'
  | 'hamster-commerce'
  | 'hamster-billing'
  | 'hamster-payment'
  | 'hamster-support'
  | 'hamster-front';

export type InstanceStatus = 'idle' | 'provisioning' | 'running' | 'failed' | 'destroying';

export type SecurityGroup = 'front-sg' | 'auth-sg' | 'internal-sg';

export interface InstanceState {
  id: InstanceId;
  label: string;
  status: InstanceStatus;
  ip?: string;
  services: string[];       // e.g. ["MySQL 8.0", "MongoDB 7.0"]
  sg: SecurityGroup;        // security group
  ports: string[];          // e.g. [":3306", ":27017"]
  startedAt?: string;       // ISO timestamp
  detail?: string;          // e.g. "8 databases created"
}

export interface InfraLog {
  timestamp: string;
  instanceId?: InstanceId;
  message: string;
  level: 'info' | 'success' | 'error' | 'warn';
}

export type SessionPhase =
  | 'idle'          // 최초 상태 - Connect 필요
  | 'connecting'    // Connect 진행중 (GitHub Actions API 조회)
  | 'connected'     // Connect 완료 - 상태에 따라 분기
  | 'planning'      // Init 진행중 (terraform plan 실행)
  | 'planned'       // Init 완료 - plan 결과 표시, Start 가능
  | 'triggering'    // Start - workflow_dispatch 트리거
  | 'applying'      // terraform apply 진행중
  | 'running'       // 인프라 가동중
  | 'destroying'    // terraform destroy 진행중
  | 'completed'     // 세션 완료
  | 'failed';       // 실패

/** Connect 후 판단된 인프라 상태 */
export type InfraStatus = 'unknown' | 'running' | 'cooldown' | 'available' | 'limit_exceeded';

// ─── Store ───

interface InfraState {
  // Session
  sessionPhase: SessionPhase;
  sessionStartedAt: string | null;     // ISO timestamp when session started
  sessionDurationMin: number;          // configured session duration (default 20)

  // Connect result
  infraStatus: InfraStatus;
  initResult: InitResult | null;

  // Plan result (terraform plan output)
  planResult: string | null;
  planRunUrl: string | null;
  planEc2Count: number | null;  // Plan 파싱 결과: aws_instance 개수 (Plan 전에는 null)

  // Planning 진행 상태
  planStep: number;          // 0~4 (dispatch, waiting, running, logs, done)
  planStepLabel: string;     // 현재 단계 설명

  // 내가 Start를 눌러 시작한 세션인지 여부 (Connect으로 감지된 기존 세션이면 false)
  startedByMe: boolean;

  // Budget
  sessionsUsedToday: number;
  maxSessionsPerDay: number;           // default 5

  // Instances
  instances: Record<InstanceId, InstanceState>;

  // Logs
  logs: InfraLog[];

  // Workflow
  activeWorkflowRunId: number | null;

  // Actions
  setSessionPhase: (phase: SessionPhase) => void;
  applyConnectResult: (result: InitResult) => void;
  applyPlanResult: (planOutput: string, runUrl?: string, ec2Count?: number) => void;
  startSession: () => void;
  endSession: () => void;
  updateInstance: (id: InstanceId, update: Partial<InstanceState>) => void;
  addLog: (log: Omit<InfraLog, 'timestamp'>) => void;
  setSessionsUsedToday: (count: number) => void;
  setActiveWorkflowRunId: (id: number | null) => void;
  setPlanStep: (step: number, label: string) => void;
  resetInstances: () => void;
  resetAll: () => void;
}

const DEFAULT_INSTANCES: Record<InstanceId, InstanceState> = {
  'hamster-db': {
    id: 'hamster-db',
    label: 'Database',
    status: 'idle',
    sg: 'internal-sg',
    services: ['MySQL 8.0', 'MongoDB 7.0'],
    ports: [':3306', ':27017'],
    detail: 'ecommerce / delivery / cash_gateway / payment / progression / notification / hamster_pg / keycloak',
  },
  'hamster-auth': {
    id: 'hamster-auth',
    label: 'Auth',
    status: 'idle',
    sg: 'auth-sg',
    services: ['Keycloak 23.0'],
    ports: [':8090'],
  },
  'hamster-kafka': {
    id: 'hamster-kafka',
    label: 'Kafka',
    status: 'idle',
    sg: 'internal-sg',
    services: ['Kafka 7.5 (KRaft)'],
    ports: [':9092', ':9093'],
  },
  'hamster-commerce': {
    id: 'hamster-commerce',
    label: 'Commerce',
    status: 'idle',
    sg: 'internal-sg',
    services: ['eCommerce API'],
    ports: [':8080'],
  },
  'hamster-billing': {
    id: 'hamster-billing',
    label: 'Billing',
    status: 'idle',
    sg: 'internal-sg',
    services: ['Cash Gateway', 'Hamster PG'],
    ports: [':8082', ':8086'],
  },
  'hamster-payment': {
    id: 'hamster-payment',
    label: 'Payment',
    status: 'idle',
    sg: 'internal-sg',
    services: ['Payment Service'],
    ports: [':8083'],
  },
  'hamster-support': {
    id: 'hamster-support',
    label: 'Support',
    status: 'idle',
    sg: 'internal-sg',
    services: ['Progression', 'Notification'],
    ports: [':8084', ':8085'],
  },
  'hamster-front': {
    id: 'hamster-front',
    label: 'Front',
    status: 'idle',
    sg: 'front-sg',
    services: ['Nginx', '4 React Apps'],
    ports: [':80'],
  },
};

function cloneInstances(): Record<InstanceId, InstanceState> {
  const clone: Record<string, InstanceState> = {};
  for (const [k, v] of Object.entries(DEFAULT_INSTANCES)) {
    clone[k] = { ...v, services: [...v.services], ports: [...v.ports] };
  }
  return clone as Record<InstanceId, InstanceState>;
}

export const useInfraStore = create<InfraState>((set) => ({
  // Session
  sessionPhase: 'idle',
  sessionStartedAt: null,
  sessionDurationMin: ACTIVE_RUNTIME_MIN,

  // Connect result
  infraStatus: 'unknown',
  initResult: null,
  planResult: null,
  planRunUrl: null,
  planEc2Count: null,
  planStep: 0,
  planStepLabel: '',
  startedByMe: false,

  // Budget
  sessionsUsedToday: 0,
  maxSessionsPerDay: MAX_SESSIONS_PER_DAY,

  // Instances
  instances: cloneInstances(),

  // Logs
  logs: [],

  // Workflow
  activeWorkflowRunId: null,

  // Actions
  setSessionPhase: (phase) => set({ sessionPhase: phase }),

  applyConnectResult: (result) => set((state) => {
    const logs: InfraLog[] = [...state.logs];
    const now = new Date().toISOString();

    logs.push({ timestamp: now, message: `동기화 완료 - 상태: ${result.status}`, level: 'info' });
    logs.push({ timestamp: now, message: `오늘: ${result.sessionsUsedToday}/${result.maxSessionsPerDay}회 사용`, level: 'info' });

    if (result.status === 'running') {
      const phase = result.detectedPhase ?? 'running';
      if (phase === 'applying') {
        logs.push({ timestamp: now, message: '세션 감지 - Terraform Apply 진행 중', level: 'info' });
      } else if (phase === 'destroying') {
        logs.push({ timestamp: now, message: '세션 감지 - Terraform Destroy 진행 중', level: 'warn' });
      } else {
        const remainMin = Math.ceil((result.remainingSeconds ?? 0) / 60);
        logs.push({ timestamp: now, message: `세션 운영 중 - ${remainMin}분 남음`, level: 'success' });
      }
    } else if (result.status === 'cooldown') {
      const cooldownSec = result.cooldownRemainingSeconds ?? 0;
      logs.push({ timestamp: now, message: `쿨다운 - 다음 세션까지 ${Math.ceil(cooldownSec / 60)}분`, level: 'warn' });
    } else if (result.status === 'limit_exceeded') {
      logs.push({ timestamp: now, message: '일일 세션 한도 초과', level: 'error' });
    } else {
      logs.push({ timestamp: now, message: '인프라 사용 가능 - Init(terraform plan) 준비됨', level: 'success' });
    }

    // 감지된 단계에 따라 인스턴스 상태 설정
    let instances = state.instances;
    let sessionPhase: SessionPhase = 'connected';

    if (result.status === 'running') {
      const phase = result.detectedPhase ?? 'running';
      const updated = { ...state.instances };

      if (phase === 'destroying') {
        for (const id of INSTANCE_IDS) {
          updated[id] = { ...updated[id], status: 'destroying' };
        }
        sessionPhase = 'destroying';
      } else if (phase === 'applying') {
        for (const id of INSTANCE_IDS) {
          updated[id] = { ...updated[id], status: 'provisioning' };
        }
        sessionPhase = 'applying';
      } else {
        for (const id of INSTANCE_IDS) {
          updated[id] = { ...updated[id], status: 'running' };
        }
        sessionPhase = 'running';
      }
      instances = updated;
    }

    return {
      sessionPhase,
      infraStatus: result.status,
      initResult: result,
      startedByMe: false, // Connect으로 감지된 세션 = 기존 세션 참여
      sessionsUsedToday: result.sessionsUsedToday,
      maxSessionsPerDay: result.maxSessionsPerDay,
      sessionDurationMin: result.workflowDurationMin - (result.cooldownMin ?? COOLDOWN_MIN),
      sessionStartedAt: result.sessionStartedAt ?? null,
      activeWorkflowRunId: result.activeRunId ?? null,
      instances,
      logs,
    };
  }),

  applyPlanResult: (planOutput, runUrl?, ec2Count?) => set((state) => ({
    sessionPhase: 'planned',
    planResult: planOutput,
    planRunUrl: runUrl ?? null,
    planEc2Count: ec2Count ?? null,
    logs: [
      ...state.logs,
      {
        timestamp: new Date().toISOString(),
        message: 'Terraform plan 완료 - 인프라 리포트를 확인하세요',
        level: 'success' as const,
      },
    ],
  })),

  startSession: () => set((state) => ({
    sessionPhase: 'triggering',
    startedByMe: true, // 내가 직접 시작한 세션
    sessionStartedAt: new Date().toISOString(),
    sessionsUsedToday: state.sessionsUsedToday + 1,
    logs: [
      ...state.logs,
      {
        timestamp: new Date().toISOString(),
        message: 'Session started - triggering GitHub Actions workflow',
        level: 'info' as const,
      },
    ],
  })),

  endSession: () => set((state) => ({
    sessionPhase: 'completed',
    logs: [
      ...state.logs,
      {
        timestamp: new Date().toISOString(),
        message: 'Session completed - all resources destroyed',
        level: 'success' as const,
      },
    ],
  })),

  updateInstance: (id, update) =>
    set((state) => ({
      instances: {
        ...state.instances,
        [id]: { ...state.instances[id], ...update },
      },
    })),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { ...log, timestamp: new Date().toISOString() },
      ],
    })),

  setSessionsUsedToday: (count) => set({ sessionsUsedToday: count }),

  setActiveWorkflowRunId: (id) => set({ activeWorkflowRunId: id }),

  setPlanStep: (step, label) => set({ planStep: step, planStepLabel: label }),

  resetInstances: () => set({ instances: cloneInstances() }),

  resetAll: () => set({
    sessionPhase: 'idle',
    sessionStartedAt: null,
    infraStatus: 'unknown',
    initResult: null,
    planResult: null,
    planRunUrl: null,
    planEc2Count: null,
    planStep: 0,
    planStepLabel: '',
    startedByMe: false,
    sessionsUsedToday: 0,
    instances: cloneInstances(),
    logs: [],
    activeWorkflowRunId: null,
  }),
}));

// ─── Selectors ───

export const selectRunningCount = (state: InfraState) =>
  Object.values(state.instances).filter((i) => i.status === 'running').length;

export const selectTotalInstances = (_state: InfraState) =>
  Object.keys(DEFAULT_INSTANCES).length;

/** Connect 가능: idle, completed, failed */
export const selectCanConnect = (state: InfraState) =>
  state.sessionPhase === 'idle' || state.sessionPhase === 'completed' || state.sessionPhase === 'failed';

/** Init(plan) 가능: connected + available */
export const selectCanInit = (state: InfraState) =>
  state.sessionPhase === 'connected' && state.infraStatus === 'available';

/** Plan 완료 후 Start 가능 */
export const selectCanStartSession = (state: InfraState) =>
  state.sessionPhase === 'planned';

/** 가동중이거나 applying일 때 Stop 가능 */
export const selectCanStop = (state: InfraState) =>
  state.sessionPhase === 'running' || state.sessionPhase === 'applying' || state.sessionPhase === 'triggering';

export const INSTANCE_IDS: InstanceId[] = [
  'hamster-db',
  'hamster-auth',
  'hamster-kafka',
  'hamster-commerce',
  'hamster-billing',
  'hamster-payment',
  'hamster-support',
  'hamster-front',
];
