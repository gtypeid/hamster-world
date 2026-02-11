import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HamsterWheel } from '../components/HamsterWheel';
import { GitHubService } from '../services/github';
import { calculateTotalMinutes, calculateRemainingMinutes, formatMinutes } from '../utils/timeCalculator';
import { useInfraStore } from '../stores/useInfraStore';

// TODO: 환경변수로 관리
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || '';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';
const WORKFLOW_ID = import.meta.env.VITE_WORKFLOW_ID || '';

const githubService = new GitHubService(GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO);

export function Infrastructure() {
  const queryClient = useQueryClient();
  const { dailyLimit, setUsage } = useInfraStore();

  // 워크플로우 실행 목록 조회 (5초마다 폴링)
  const { data: workflowRuns, isLoading } = useQuery({
    queryKey: ['workflow-runs'],
    queryFn: () => githubService.getWorkflowRuns(WORKFLOW_ID),
    refetchInterval: 5000,
  });

  const totalMinutesUsed = workflowRuns
    ? calculateTotalMinutes(workflowRuns.workflow_runs)
    : 0;

  const remainingMinutes = calculateRemainingMinutes(totalMinutesUsed, dailyLimit);
  const canTrigger = remainingMinutes > 10; // 최소 10분 이상 남아있어야 트리거 가능

  // 사용량 업데이트
  if (totalMinutesUsed !== useInfraStore.getState().totalMinutesUsed) {
    setUsage(totalMinutesUsed);
  }

  // 워크플로우 트리거 mutation
  const triggerMutation = useMutation({
    mutationFn: (action: string) =>
      githubService.triggerWorkflow(WORKFLOW_ID, 'main', { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-runs'] });
    },
  });

  const handleTrigger = (action: 'create' | 'deploy' | 'destroy') => {
    if (!canTrigger && action !== 'destroy') {
      alert('남은 시간이 부족합니다!');
      return;
    }
    triggerMutation.mutate(action);
  };

  const isAnyRunning = workflowRuns?.workflow_runs.some(
    run => run.status === 'in_progress' || run.status === 'queued'
  ) ?? false;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            🎮 Infrastructure Control
          </h1>
          <p className="text-gray-600 text-sm">
            AWS Infrastructure Control via GitHub Actions
          </p>
        </header>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 햄스터 챗바퀴 */}
          <div className="lg:col-span-1 bg-dark-card rounded-lg p-6 border border-dark-border">
            <HamsterWheel
              isRunning={isAnyRunning}
              isExhausted={!canTrigger}
            />
          </div>

          {/* 사용량 정보 */}
          <div className="lg:col-span-2 bg-dark-card rounded-lg p-6 border border-dark-border">
            <h2 className="text-xl font-bold mb-4 text-aws-orange">📊 Resource Usage</h2>

            {isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Used Today:</span>
                  <span className="text-2xl font-mono text-green-500">
                    {formatMinutes(totalMinutesUsed)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Remaining:</span>
                  <span className={`text-2xl font-mono ${canTrigger ? 'text-blue-400' : 'text-red-500'}`}>
                    {formatMinutes(remainingMinutes)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-dark-hover rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        totalMinutesUsed / dailyLimit > 0.9
                          ? 'bg-red-500'
                          : totalMinutesUsed / dailyLimit > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((totalMinutesUsed / dailyLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {((totalMinutesUsed / dailyLimit) * 100).toFixed(1)}% of daily limit
                  </p>
                </div>

                {/* 상태 */}
                <div className="pt-4 border-t border-dark-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isAnyRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-sm text-gray-400">
                      {isAnyRunning ? 'Workflow Running' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-bold mb-4 text-github-purple">🎮 Terraform Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Create Instance */}
            <button
              onClick={() => handleTrigger('create')}
              disabled={!canTrigger || isAnyRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              <div className="text-2xl mb-2">🚀</div>
              <div>Create Instance</div>
              <div className="text-xs opacity-75 mt-1">Terraform Apply</div>
            </button>

            {/* Deploy Application */}
            <button
              onClick={() => handleTrigger('deploy')}
              disabled={!canTrigger || isAnyRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              <div className="text-2xl mb-2">🐳</div>
              <div>Deploy App</div>
              <div className="text-xs opacity-75 mt-1">Docker Run</div>
            </button>

            {/* Destroy Resources */}
            <button
              onClick={() => handleTrigger('destroy')}
              disabled={isAnyRunning}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              <div className="text-2xl mb-2">🗑️</div>
              <div>Destroy</div>
              <div className="text-xs opacity-75 mt-1">Cleanup Resources</div>
            </button>
          </div>

          {!canTrigger && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <p className="text-yellow-500 text-sm">
                ⚠️ Daily limit almost reached. Only destroy operations available.
              </p>
            </div>
          )}
        </div>

        {/* Recent Runs */}
        <div className="mt-8 bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-bold mb-4">📜 Recent Workflow Runs</h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workflowRuns?.workflow_runs.slice(0, 10).map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-3 bg-dark-hover/50 rounded border border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    run.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
                    run.conclusion === 'success' ? 'bg-green-500' :
                    run.conclusion === 'failure' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="font-mono text-sm">{run.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(run.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
