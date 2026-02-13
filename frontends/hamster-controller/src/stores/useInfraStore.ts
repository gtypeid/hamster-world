import { create } from 'zustand';

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

export interface InstanceState {
  id: InstanceId;
  label: string;
  status: InstanceStatus;
  ip?: string;
  services: string[];       // e.g. ["MySQL", "MongoDB"]
  startedAt?: string;       // ISO timestamp
  detail?: string;          // e.g. "8 databases created"
}

export interface InfraLog {
  timestamp: string;
  instanceId?: InstanceId;
  message: string;
  level: 'info' | 'success' | 'error' | 'warn';
}

export type SessionPhase = 'idle' | 'triggering' | 'applying' | 'running' | 'destroying' | 'completed' | 'failed';

// ─── Store ───

interface InfraState {
  // Session
  sessionPhase: SessionPhase;
  sessionStartedAt: string | null;     // ISO timestamp when session started
  sessionDurationMin: number;          // configured session duration (default 25)

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
  startSession: () => void;
  endSession: () => void;
  updateInstance: (id: InstanceId, update: Partial<InstanceState>) => void;
  addLog: (log: Omit<InfraLog, 'timestamp'>) => void;
  setSessionsUsedToday: (count: number) => void;
  setActiveWorkflowRunId: (id: number | null) => void;
  resetInstances: () => void;
}

const DEFAULT_INSTANCES: Record<InstanceId, InstanceState> = {
  'hamster-db': {
    id: 'hamster-db',
    label: 'Database',
    status: 'idle',
    services: ['MySQL', 'MongoDB'],
  },
  'hamster-auth': {
    id: 'hamster-auth',
    label: 'Auth',
    status: 'idle',
    services: ['Keycloak'],
  },
  'hamster-kafka': {
    id: 'hamster-kafka',
    label: 'Kafka',
    status: 'idle',
    services: ['Kafka KRaft'],
  },
  'hamster-commerce': {
    id: 'hamster-commerce',
    label: 'Commerce',
    status: 'idle',
    services: ['eCommerce API'],
  },
  'hamster-billing': {
    id: 'hamster-billing',
    label: 'Billing',
    status: 'idle',
    services: ['Cash Gateway', 'Hamster PG'],
  },
  'hamster-payment': {
    id: 'hamster-payment',
    label: 'Payment',
    status: 'idle',
    services: ['Payment Service'],
  },
  'hamster-support': {
    id: 'hamster-support',
    label: 'Support',
    status: 'idle',
    services: ['Progression', 'Notification'],
  },
  'hamster-front': {
    id: 'hamster-front',
    label: 'Front',
    status: 'idle',
    services: ['Nginx', 'React Apps'],
  },
};

function cloneInstances(): Record<InstanceId, InstanceState> {
  const clone: Record<string, InstanceState> = {};
  for (const [k, v] of Object.entries(DEFAULT_INSTANCES)) {
    clone[k] = { ...v, services: [...v.services] };
  }
  return clone as Record<InstanceId, InstanceState>;
}

export const useInfraStore = create<InfraState>((set) => ({
  // Session
  sessionPhase: 'idle',
  sessionStartedAt: null,
  sessionDurationMin: 25,

  // Budget
  sessionsUsedToday: 0,
  maxSessionsPerDay: 5,

  // Instances
  instances: cloneInstances(),

  // Logs
  logs: [],

  // Workflow
  activeWorkflowRunId: null,

  // Actions
  setSessionPhase: (phase) => set({ sessionPhase: phase }),

  startSession: () => set((state) => ({
    sessionPhase: 'triggering',
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

  resetInstances: () => set({ instances: cloneInstances() }),
}));

// ─── Selectors ───

export const selectRunningCount = (state: InfraState) =>
  Object.values(state.instances).filter((i) => i.status === 'running').length;

export const selectTotalInstances = (_state: InfraState) =>
  Object.keys(DEFAULT_INSTANCES).length;

export const selectCanStartSession = (state: InfraState) =>
  state.sessionPhase === 'idle' && state.sessionsUsedToday < state.maxSessionsPerDay;

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
