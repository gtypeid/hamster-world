import {
  useInfraStore,
  selectCanStartSession,
  selectCanConnect,
  selectCanInit,
  selectCanStop,
  INSTANCE_IDS,
} from '../../stores/useInfraStore';
import { mockInit } from '../../services/mockGithub';

// Mock: simulate terraform plan output
const MOCK_PLAN_OUTPUT = `Plan: 12 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + entrypoint          = { front_url = "http://(known after apply)", keycloak_url = "http://(known after apply)/keycloak" }
  + instances           = { 8x t3.micro EC2 instances }
  + security_groups     = { front-sg (Public), auth-sg (VPC), internal-sg (VPC) }
  + api_routes          = { 7 reverse proxy routes }
  + infrastructure_spec = { ap-northeast-2, 64GB total storage }`;

function mockPlan(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PLAN_OUTPUT), 2000);
  });
}

// Demo mode: simulate terraform deployment steps
function simulateDeployment() {
  const { setSessionPhase, updateInstance, addLog } = useInfraStore.getState();

  const steps: { delay: number; action: () => void }[] = [
    {
      delay: 1500,
      action: () => {
        setSessionPhase('applying');
        addLog({ message: 'Terraform apply 시작', level: 'info' });
      },
    },
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-db', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-db', message: '[internal-sg] 인스턴스 시작 중...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-db', { status: 'running', ip: '172.31.10.5' });
        addLog({ instanceId: 'hamster-db', message: 'MySQL 8.0 가동 (:3306), 데이터베이스 8개 생성', level: 'success' });
        addLog({ instanceId: 'hamster-db', message: 'MongoDB 7.0 가동 (:27017)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-kafka', { status: 'provisioning' });
        updateInstance('hamster-auth', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-kafka', message: '[internal-sg] 인스턴스 시작 중...', level: 'info' });
        addLog({ instanceId: 'hamster-auth', message: '[auth-sg] 인스턴스 시작 중...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-kafka', { status: 'running', ip: '172.31.10.8' });
        addLog({ instanceId: 'hamster-kafka', message: 'Kafka 7.5 KRaft 브로커 준비 완료 (:9092, :9093)', level: 'success' });
      },
    },
    {
      delay: 2000,
      action: () => {
        updateInstance('hamster-auth', { status: 'running', ip: '172.31.10.6' });
        addLog({ instanceId: 'hamster-auth', message: 'Keycloak 23.0 가동 (:8090), realm 임포트 완료', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-commerce', { status: 'provisioning' });
        updateInstance('hamster-billing', { status: 'provisioning' });
        updateInstance('hamster-payment', { status: 'provisioning' });
        updateInstance('hamster-support', { status: 'provisioning' });
        addLog({ message: '[internal-sg] 애플리케이션 인스턴스 시작 중...', level: 'info' });
      },
    },
    {
      delay: 2500,
      action: () => {
        updateInstance('hamster-commerce', { status: 'running', ip: '172.31.10.11' });
        addLog({ instanceId: 'hamster-commerce', message: 'eCommerce API 준비 완료 (:8080)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-billing', { status: 'running', ip: '172.31.10.12' });
        addLog({ instanceId: 'hamster-billing', message: 'Cash Gateway 가동 (:8082), Hamster PG 가동 (:8086)', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-payment', { status: 'running', ip: '172.31.10.13' });
        addLog({ instanceId: 'hamster-payment', message: 'Payment Service 가동 (:8083)', level: 'success' });
      },
    },
    {
      delay: 1500,
      action: () => {
        updateInstance('hamster-support', { status: 'running', ip: '172.31.10.14' });
        addLog({ instanceId: 'hamster-support', message: 'Progression 가동 (:8084), Notification 가동 (:8085)', level: 'success' });
      },
    },
    {
      delay: 1000,
      action: () => {
        updateInstance('hamster-front', { status: 'provisioning' });
        addLog({ instanceId: 'hamster-front', message: '[front-sg] 프론트엔드 이미지 풀링 중...', level: 'info' });
      },
    },
    {
      delay: 3000,
      action: () => {
        updateInstance('hamster-front', { status: 'running', ip: '3.35.42.117' });
        addLog({ instanceId: 'hamster-front', message: 'Nginx (:80) + React 앱 4개 배포 완료', level: 'success' });
        addLog({ message: '전체 8개 인스턴스 온라인 - 인프라 준비 완료', level: 'success' });
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
  addLog({ message: 'Terraform destroy 시작', level: 'warn' });

  setTimeout(() => {
    for (const id of INSTANCE_IDS) {
      updateInstance(id, { status: 'destroying' });
    }
    addLog({ message: '전체 인스턴스 종료 중...', level: 'info' });
  }, 1000);

  setTimeout(() => {
    resetInstances();
    endSession();
  }, 4000);
}

export function SessionControl() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const infraStatus = useInfraStore((s) => s.infraStatus);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const initResult = useInfraStore((s) => s.initResult);

  const canConnect = useInfraStore(selectCanConnect);
  const canInit = useInfraStore(selectCanInit);
  const canStart = useInfraStore(selectCanStartSession);
  const canStop = useInfraStore(selectCanStop);

  const setSessionPhase = useInfraStore((s) => s.setSessionPhase);
  const applyConnectResult = useInfraStore((s) => s.applyConnectResult);
  const applyPlanResult = useInfraStore((s) => s.applyPlanResult);
  const addLog = useInfraStore((s) => s.addLog);
  const startSession = useInfraStore((s) => s.startSession);

  const handleConnect = async () => {
    setSessionPhase('connecting');
    addLog({ message: 'GitHub Actions 동기화 중...', level: 'info' });

    try {
      const result = await mockInit();
      applyConnectResult(result);
    } catch {
      setSessionPhase('failed');
      addLog({ message: 'GitHub Actions 동기화 실패', level: 'error' });
    }
  };

  const handleInit = async () => {
    setSessionPhase('planning');
    addLog({ message: 'Terraform plan 실행 중...', level: 'info' });

    try {
      const planOutput = await mockPlan();
      applyPlanResult(planOutput);
    } catch {
      setSessionPhase('failed');
      addLog({ message: 'Terraform plan 실패', level: 'error' });
    }
  };

  const handleStart = () => {
    startSession();
    simulateDeployment();
  };

  const handleStop = () => {
    simulateDestroy();
  };

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

      {/* Status badge (Connect 결과) */}
      {sessionPhase === 'connected' && (
        <div className={`text-center text-xs font-semibold py-1.5 rounded ${getStatusStyle(infraStatus)}`}>
          {getStatusMessage(infraStatus, initResult)}
        </div>
      )}

      {/* Plan result badge */}
      {sessionPhase === 'planned' && (
        <div className="text-center text-xs font-semibold py-1.5 rounded bg-blue-900/30 text-blue-400">
          Plan 완료 - 배포 준비됨
        </div>
      )}

      {/* Control buttons - 4 buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={!canConnect}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          {sessionPhase === 'connecting' ? 'Syncing...' : 'Connect'}
        </button>
        <button
          onClick={handleInit}
          disabled={!canInit}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          {sessionPhase === 'planning' ? 'Planning...' : 'Init'}
        </button>
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!canStop}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-xs"
        >
          Stop
        </button>
      </div>
    </div>
  );
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'running': return 'bg-green-900/30 text-green-400';
    case 'cooldown': return 'bg-yellow-900/30 text-yellow-400';
    case 'available': return 'bg-blue-900/30 text-blue-400';
    case 'limit_exceeded': return 'bg-red-900/30 text-red-400';
    default: return 'bg-gray-800 text-gray-400';
  }
}

function getStatusMessage(status: string, initResult: any): string {
  switch (status) {
    case 'running': {
      const remain = Math.ceil((initResult?.remainingSeconds ?? 0) / 60);
      return `운영 중 - ${remain}분 남음`;
    }
    case 'cooldown': {
      const cd = Math.ceil((initResult?.cooldownRemainingSeconds ?? 0) / 60);
      return `쿨다운 - ${cd}분`;
    }
    case 'available':
      return 'Init 가능 (terraform plan)';
    case 'limit_exceeded':
      return '일일 한도 초과';
    default:
      return status;
  }
}
