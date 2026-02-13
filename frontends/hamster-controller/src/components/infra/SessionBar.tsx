import { useState, useEffect } from 'react';
import {
  useInfraStore,
  selectCanStartSession,
  selectRunningCount,
  selectTotalInstances,
  INSTANCE_IDS,
} from '../../stores/useInfraStore';

// ─── Demo simulation (unchanged logic) ───

function simulateDeployment() {
  const { setSessionPhase, updateInstance, addLog } = useInfraStore.getState();

  const steps: { delay: number; action: () => void }[] = [
    {
      delay: 1500,
      action: () => {
        setSessionPhase('applying');
        addLog({ message: 'Terraform apply started', level: 'info' });
      },
    },
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-db', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-db', message: '[internal-sg] Instance launching...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-db', { status: 'running', ip: '172.31.10.5' });
        addLog({ instanceId: 'hamster-db', message: 'MySQL 8.0 started (:3306), 8 databases created', level: 'success' });
        addLog({ instanceId: 'hamster-db', message: 'DBs: ecommerce, delivery, cash_gateway, payment, progression, notification, hamster_pg, keycloak', level: 'info' });
        addLog({ instanceId: 'hamster-db', message: 'MongoDB 7.0 started (:27017)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-kafka', { status: 'provisioning' });
        updateInstance('hamster-auth', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-kafka', message: '[internal-sg] Instance launching...', level: 'info' });
        addLog({ instanceId: 'hamster-auth', message: '[auth-sg] Instance launching...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-kafka', { status: 'running', ip: '172.31.10.8' });
        addLog({ instanceId: 'hamster-kafka', message: 'Kafka 7.5 KRaft broker ready (:9092, :9093)', level: 'success' });
      },
    },
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-auth', { status: 'running', ip: '172.31.10.6' });
        addLog({ instanceId: 'hamster-auth', message: 'Keycloak 23.0 started (:8090), realm imported', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-commerce', { status: 'provisioning' });
        updateInstance('hamster-billing', { status: 'provisioning' });
        updateInstance('hamster-payment', { status: 'provisioning' });
        updateInstance('hamster-support', { status: 'provisioning' });
        addLog({ message: '[internal-sg] Application instances launching...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-commerce', { status: 'running', ip: '172.31.10.11' });
        addLog({ instanceId: 'hamster-commerce', message: 'eCommerce API ready (:8080) \u2192 ecommerce_db', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-billing', { status: 'running', ip: '172.31.10.12' });
        addLog({ instanceId: 'hamster-billing', message: 'Cash Gateway (:8082) \u2192 cash_gateway_db', level: 'success' });
        addLog({ instanceId: 'hamster-billing', message: 'Hamster PG (:8086) \u2192 hamster_pg_db', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-payment', { status: 'running', ip: '172.31.10.13' });
        addLog({ instanceId: 'hamster-payment', message: 'Payment Service (:8083) \u2192 payment_db', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-support', { status: 'running', ip: '172.31.10.14' });
        addLog({ instanceId: 'hamster-support', message: 'Progression (:8084) \u2192 progression_db', level: 'success' });
        addLog({ instanceId: 'hamster-support', message: 'Notification (:8085) \u2192 notification_db + MongoDB', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-front', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-front', message: '[front-sg] Instance launching, pulling frontend images...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-front', { status: 'running', ip: '3.35.42.117' });
        addLog({ instanceId: 'hamster-front', message: 'Nginx (:80) + 4 React apps deployed', level: 'success' });
        addLog({ message: 'All 8 instances online - infrastructure ready', level: 'success' });
        setSessionPhase('running');
      },
    },
  ];

  let totalDelay = 0;
  for (const step of steps) {
    totalDelay += step.delay;
    setTimeout(step.action, totalDelay);
  }
}

function simulateDestroy() {
  const { setSessionPhase, updateInstance, addLog, endSession, resetInstances } = useInfraStore.getState();

  setSessionPhase('destroying');
  addLog({ message: 'Terraform destroy initiated', level: 'warn' });

  setTimeout(() => {
    for (const id of INSTANCE_IDS) {
      updateInstance(id, { status: 'destroying' });
    }
    addLog({ message: 'Terminating all instances...', level: 'info' });
  }, 1000);

  setTimeout(() => {
    resetInstances();
    endSession();
  }, 4000);
}

// ─── Component ───

export function SessionBar() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const sessionStartedAt = useInfraStore((s) => s.sessionStartedAt);
  const sessionDurationMin = useInfraStore((s) => s.sessionDurationMin);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const canStart = useInfraStore(selectCanStartSession);
  const startSession = useInfraStore((s) => s.startSession);
  const runningCount = useInfraStore(selectRunningCount);
  const totalInstances = useInfraStore(selectTotalInstances);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionStartedAt || sessionPhase === 'idle' || sessionPhase === 'completed') {
      setElapsed(0);
      return;
    }
    const startTime = new Date(sessionStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt, sessionPhase]);

  const handleStart = () => { startSession(); simulateDeployment(); };
  const handleStop = () => { simulateDestroy(); };

  const isActive = sessionPhase !== 'idle' && sessionPhase !== 'completed' && sessionPhase !== 'failed';
  const totalSeconds = sessionDurationMin * 60;
  const progressPercent = Math.min((elapsed / totalSeconds) * 100, 100);

  return (
    <div className="relative">
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isActive
            ? 'linear-gradient(90deg, #6366f1, #d97706, #16a34a)'
            : 'linear-gradient(90deg, #334155, #334155)',
        }}
      />

      <div className="flex items-center gap-5 px-5 py-2.5 h-14">
        {/* Phase indicator + label */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${getPhaseColor(sessionPhase)}`} />
          <span className={`text-sm font-semibold w-36 truncate ${
            isActive ? 'text-white' : 'text-gray-400'
          }`}>
            {getPhaseLabel(sessionPhase)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="px-5 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-green-900/20 hover:shadow-green-800/30"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isActive}
            className="px-5 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-red-900/20"
          >
            Stop
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-700 shrink-0" />

        {/* Timer */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Timer</span>
          <span className="font-mono text-base tabular-nums">
            <span className={isActive ? 'text-accent-orange' : 'text-gray-600'}>
              {formatTime(elapsed)}
            </span>
            <span className="text-gray-700 mx-0.5">/</span>
            <span className="text-gray-500">{formatTime(totalSeconds)}</span>
          </span>
        </div>

        {/* Time progress bar */}
        <div className="flex-1 min-w-0 max-w-xs">
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-1000 relative"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent > 90 ? '#ef4444' : progressPercent > 70 ? '#eab308' : '#6366f1',
              }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-700 shrink-0" />

        {/* Instances */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">EC2</span>
          <span className="font-mono text-base tabular-nums">
            <span className={runningCount > 0 ? 'text-green-400 font-bold' : 'text-gray-600'}>{runningCount}</span>
            <span className="text-gray-700 mx-0.5">/</span>
            <span className="text-gray-500">{totalInstances}</span>
          </span>
          <div className="w-20 bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500 relative"
              style={{
                width: `${(runningCount / totalInstances) * 100}%`,
                background: 'linear-gradient(90deg, #16a34a, #4ade80)',
              }}
            >
              {runningCount > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-700 shrink-0" />

        {/* Session budget */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Budget</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxSessionsPerDay }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-2 rounded-sm transition-colors ${
                  i < sessionsUsedToday ? 'bg-accent-orange shadow-sm shadow-amber-900/50' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 font-mono tabular-nums">{sessionsUsedToday}/{maxSessionsPerDay}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'idle': return 'Ready';
    case 'triggering': return 'Triggering...';
    case 'applying': return 'Terraform Apply...';
    case 'running': return 'Online';
    case 'destroying': return 'Destroying...';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    default: return phase;
  }
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'idle': return 'bg-gray-500';
    case 'triggering': return 'bg-indigo-500 animate-pulse';
    case 'applying': return 'bg-amber-500 animate-pulse';
    case 'running': return 'bg-green-500 animate-pulse';
    case 'destroying': return 'bg-orange-500 animate-pulse';
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}
