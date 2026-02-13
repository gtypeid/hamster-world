import { useInfraStore, selectCanStartSession, INSTANCE_IDS } from '../../stores/useInfraStore';

// Demo mode: simulate terraform deployment steps
function simulateDeployment() {
  const { setSessionPhase, updateInstance, addLog } = useInfraStore.getState();

  const steps: { delay: number; action: () => void }[] = [
    // Phase: applying
    {
      delay: 1500,
      action: () => {
        setSessionPhase('applying');
        addLog({ message: 'Terraform apply started', level: 'info' });
      },
    },
    // DB provisioning
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-db', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-db', message: 'Instance launching...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-db', { status: 'running', ip: '172.31.10.5' });
        addLog({ instanceId: 'hamster-db', message: 'MySQL started, 8 databases created', level: 'success' });
        addLog({ instanceId: 'hamster-db', message: 'MongoDB started', level: 'success' });
      },
    },
    // Auth + Kafka in parallel
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-auth', { status: 'provisioning' });
        updateInstance('hamster-kafka', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-auth', message: 'Instance launching...', level: 'info' });
        addLog({ instanceId: 'hamster-kafka', message: 'Instance launching...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-kafka', { status: 'running', ip: '172.31.10.8' });
        addLog({ instanceId: 'hamster-kafka', message: 'KRaft broker ready (9092, 9093)', level: 'success' });
      },
    },
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-auth', { status: 'running', ip: '172.31.10.6' });
        addLog({ instanceId: 'hamster-auth', message: 'Keycloak started, realm imported', level: 'success' });
      },
    },
    // App instances
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-commerce', { status: 'provisioning' });
        updateInstance('hamster-billing', { status: 'provisioning' });
        updateInstance('hamster-payment', { status: 'provisioning' });
        updateInstance('hamster-support', { status: 'provisioning' });
        addLog({ message: 'Application instances launching...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-commerce', { status: 'running', ip: '172.31.10.11' });
        addLog({ instanceId: 'hamster-commerce', message: 'eCommerce API ready (:8080)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-billing', { status: 'running', ip: '172.31.10.12' });
        addLog({ instanceId: 'hamster-billing', message: 'Cash Gateway (:8082) + Hamster PG (:8086) ready', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-payment', { status: 'running', ip: '172.31.10.13' });
        addLog({ instanceId: 'hamster-payment', message: 'Payment Service ready (:8083)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-support', { status: 'running', ip: '172.31.10.14' });
        addLog({ instanceId: 'hamster-support', message: 'Progression (:8084) + Notification (:8085) ready', level: 'success' });
      },
    },
    // Front
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-front', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-front', message: 'Instance launching, pulling frontend images...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-front', { status: 'running', ip: '3.35.42.117' });
        addLog({ instanceId: 'hamster-front', message: 'Nginx + React apps deployed', level: 'success' });
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

  // Mark all as destroying
  setTimeout(() => {
    for (const id of INSTANCE_IDS) {
      updateInstance(id, { status: 'destroying' });
    }
    addLog({ message: 'Terminating all instances...', level: 'info' });
  }, 1000);

  // Complete
  setTimeout(() => {
    resetInstances();
    endSession();
  }, 4000);
}

export function SessionControl() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const canStart = useInfraStore(selectCanStartSession);
  const startSession = useInfraStore((s) => s.startSession);

  const handleStart = () => {
    startSession();
    simulateDeployment();
  };

  const handleStop = () => {
    simulateDestroy();
  };

  const isActive = sessionPhase !== 'idle' && sessionPhase !== 'completed' && sessionPhase !== 'failed';

  return (
    <div className="space-y-3">
      {/* Budget info */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Sessions</span>
          <span className="text-xs text-gray-500 font-mono">
            {sessionsUsedToday}/{maxSessionsPerDay}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxSessionsPerDay }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-sm ${
                i < sessionsUsedToday ? 'bg-accent-orange' : 'bg-dark-hover'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Control buttons - stacked */}
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isActive}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
