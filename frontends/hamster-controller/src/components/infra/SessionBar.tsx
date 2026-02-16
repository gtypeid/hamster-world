import { useState, useEffect } from 'react';
import {
  useInfraStore,
  selectCanStartSession,
  selectCanConnect,
  selectCanInit,
  selectCanStop,
  selectRunningCount,
  INSTANCE_IDS,
} from '../../stores/useInfraStore';
import { fetchInfraStatus, triggerPlan, triggerApply, cancelRun, getRunStatus } from '../../services/infraSession';
import { parsePlanOutput } from '../../utils/parsePlan';
import { COOLDOWN_MIN } from '../../config/infraConfig';
import { startDestroyPolling, stopDestroyPolling } from '../../services/destroyPoller';

/**
 * Apply 워크플로우 런 폴링 - 완료될 때까지 5초마다 상태 확인
 */
async function pollApplyRun(runId: number) {
  const { setSessionPhase, addLog, updateInstance } = useInfraStore.getState();

  const poll = async () => {
    try {
      const run = await getRunStatus(runId);

      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          // 성공: 모든 인스턴스 running으로 전환
          for (const id of INSTANCE_IDS) {
            updateInstance(id, { status: 'running' });
          }
          addLog({ message: `전체 ${INSTANCE_IDS.length}개 인스턴스 온라인 - 인프라 준비 완료`, level: 'success' });
          setSessionPhase('running');
        } else {
          addLog({ message: `Apply 워크플로우 종료: ${run.conclusion}`, level: 'error' });
          setSessionPhase('failed');
        }
        return; // 폴링 종료
      }

      // 아직 진행중 - 계속 폴링
      setTimeout(poll, 5000);
    } catch (err) {
      addLog({ message: `폴링 오류: ${err instanceof Error ? err.message : err}`, level: 'error' });
      setTimeout(poll, 10000); // 에러시 10초 후 재시도
    }
  };

  setTimeout(poll, 5000);
}

/**
 * Destroy phase 시작.
 * runId가 있으면 실제 로그 폴링, 없으면 즉시 세션 종료(fallback).
 */
function enterDestroyPhase() {
  const { activeWorkflowRunId } = useInfraStore.getState();

  if (activeWorkflowRunId) {
    startDestroyPolling(activeWorkflowRunId);
  } else {
    // runId 없는 fallback (Connect으로 감지된 세션 등)
    const { setSessionPhase, updateInstance, addLog, endSession, resetInstances } = useInfraStore.getState();
    setSessionPhase('destroying');
    addLog({ message: 'Terraform destroy 진행 중 (로그 폴링 불가)', level: 'warn' });
    for (const id of INSTANCE_IDS) {
      updateInstance(id, { status: 'destroying' });
    }
    setTimeout(() => {
      resetInstances();
      endSession();
    }, 5000);
  }
}

// ─── Component ───

export function SessionBar() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const infraStatus = useInfraStore((s) => s.infraStatus);
  const sessionStartedAt = useInfraStore((s) => s.sessionStartedAt);
  const sessionDurationMin = useInfraStore((s) => s.sessionDurationMin);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const initResult = useInfraStore((s) => s.initResult);

  const canConnect = useInfraStore(selectCanConnect);
  const canInit = useInfraStore(selectCanInit);
  const canStart = useInfraStore(selectCanStartSession);
  const canStop = useInfraStore(selectCanStop);
  const runningCount = useInfraStore(selectRunningCount);
  const planEc2Count = useInfraStore((s) => s.planEc2Count);

  const setSessionPhase = useInfraStore((s) => s.setSessionPhase);
  const applyConnectResult = useInfraStore((s) => s.applyConnectResult);
  const applyPlanResult = useInfraStore((s) => s.applyPlanResult);
  const addLog = useInfraStore((s) => s.addLog);
  const startSession = useInfraStore((s) => s.startSession);
  const setActiveWorkflowRunId = useInfraStore((s) => s.setActiveWorkflowRunId);

  const [elapsed, setElapsed] = useState(0);

  // 타이머 - running 상태에서 경과 시간 추적
  useEffect(() => {
    if (!sessionStartedAt || sessionPhase === 'idle' || sessionPhase === 'completed' || sessionPhase === 'connected' || sessionPhase === 'planned') {
      // Connect으로 running 복원된 경우: initResult의 elapsedSeconds 사용
      if (sessionPhase === 'running' && initResult?.elapsedSeconds != null) {
        const startTime = new Date(sessionStartedAt!).getTime();
        const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
      }
      setElapsed(0);
      return;
    }
    const startTime = new Date(sessionStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt, sessionPhase, initResult]);

  // Active runtime 만료 → 자동 destroy phase 진입
  useEffect(() => {
    if (sessionPhase === 'running' && elapsed > 0 && elapsed >= sessionDurationMin * 60) {
      enterDestroyPhase();
    }
  }, [sessionPhase, elapsed, sessionDurationMin]);

  // Destroy poller cleanup on unmount
  useEffect(() => {
    return () => stopDestroyPolling();
  }, []);

  // ─── Handlers ───

  const handleConnect = async () => {
    setSessionPhase('connecting');
    addLog({ message: 'GitHub Actions 동기화 중...', level: 'info' });

    try {
      const result = await fetchInfraStatus();
      applyConnectResult(result);
    } catch (err) {
      setSessionPhase('failed');
      addLog({ message: `동기화 실패: ${err instanceof Error ? err.message : err}`, level: 'error' });
    }
  };

  const handleInit = async () => {
    setSessionPhase('planning');

    try {
      const result = await triggerPlan((message, level) => {
        addLog({ message, level: level || 'info' });
      });
      const parsed = parsePlanOutput(result.logs);
      const ec2Count = parsed?.resources.find(r => r.type === 'aws_instance')?.count;
      applyPlanResult(result.logs, result.runUrl, ec2Count);
    } catch (err) {
      setSessionPhase('failed');
      addLog({ message: `Plan 실패: ${err instanceof Error ? err.message : err}`, level: 'error' });
    }
  };

  const handleStart = async () => {
    startSession();

    try {
      addLog({ message: 'terraform-apply.yml 워크플로우 디스패치 중...', level: 'info' });
      const runId = await triggerApply();
      setActiveWorkflowRunId(runId);
      addLog({ message: `Apply 워크플로우 시작 (run #${runId})`, level: 'success' });
      setSessionPhase('applying');

      // 워크플로우 완료까지 폴링
      pollApplyRun(runId);
    } catch (err) {
      addLog({ message: `Apply 트리거 실패: ${err instanceof Error ? err.message : err}`, level: 'error' });
      setSessionPhase('failed');
    }
  };

  const handleStop = async () => {
    const runId = useInfraStore.getState().activeWorkflowRunId;

    if (runId) {
      try {
        addLog({ message: `워크플로우 run #${runId} 취소 중...`, level: 'warn' });
        await cancelRun(runId);
        addLog({ message: '취소 요청 전송 완료', level: 'info' });
      } catch (err) {
        addLog({ message: `취소 실패: ${err instanceof Error ? err.message : err}`, level: 'error' });
      }
    }
    enterDestroyPhase();
  };

  const isActive = sessionPhase === 'triggering' || sessionPhase === 'applying' || sessionPhase === 'running' || sessionPhase === 'destroying';
  const isDestroying = sessionPhase === 'destroying';
  // EC2 표시: Plan 결과에서 파싱된 값 사용, 없으면 '?'
  const ec2Total = planEc2Count ?? null;
  const activeSeconds = sessionDurationMin * 60; // ACTIVE_RUNTIME_MIN 기반
  const cooldownSeconds = COOLDOWN_MIN * 60;
  const remaining = isDestroying ? 0 : Math.max(activeSeconds - elapsed, 0);
  const remainPercent = activeSeconds > 0 ? Math.max((remaining / activeSeconds) * 100, 0) : 100;
  // Destroy phase: 경과 시간 = elapsed - activeSeconds (active runtime 이후 시간)
  const destroyElapsed = isDestroying ? Math.max(elapsed - activeSeconds, 0) : 0;
  const destroyPercent = cooldownSeconds > 0 ? Math.min((destroyElapsed / cooldownSeconds) * 100, 100) : 0;

  return (
    <div className="relative">
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isDestroying
            ? 'linear-gradient(90deg, #f97316, #ef4444)'
            : isActive
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
            {getPhaseLabel(sessionPhase, infraStatus)}
          </span>
        </div>

        {/* Buttons: Connect / Init / Start / Stop */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleConnect}
            disabled={!canConnect}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-purple-900/20"
          >
            {sessionPhase === 'connecting' ? 'Syncing...' : 'Connect'}
          </button>
          <button
            onClick={handleInit}
            disabled={!canInit}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-indigo-900/20"
          >
            {sessionPhase === 'planning' ? 'Planning...' : 'Init'}
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-green-900/20"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!canStop}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700/50 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-all text-xs shadow-lg shadow-red-900/20"
          >
            Stop
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gray-700 shrink-0" />

        {/* Status message (Connect 결과) */}
        {sessionPhase === 'connected' && (
          <>
            <div className="shrink-0">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(infraStatus)}`}>
                {getStatusLabel(infraStatus)}
              </span>
            </div>
            {infraStatus === 'cooldown' && initResult?.cooldownRemainingSeconds != null && (
              <span className="text-xs text-gray-400">
                {Math.ceil(initResult.cooldownRemainingSeconds / 60)}min cooldown
              </span>
            )}
            <div className="w-px h-7 bg-gray-700 shrink-0" />
          </>
        )}

        {/* Plan result badge */}
        {sessionPhase === 'planned' && (
          <>
            <div className="shrink-0">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-900/50 text-blue-400 border border-blue-700/50">
                PLAN READY
              </span>
            </div>
            <div className="w-px h-7 bg-gray-700 shrink-0" />
          </>
        )}

        {/* Timer - remaining / destroying */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${isDestroying ? 'text-orange-500' : 'text-gray-500'}`}>
            {isDestroying ? 'Destroying' : 'Remaining'}
          </span>
          <span className="font-mono text-base tabular-nums">
            {isDestroying ? (
              <>
                <span className="text-orange-400">{formatTime(destroyElapsed)}</span>
                <span className="text-gray-700 mx-0.5">/</span>
                <span className="text-gray-500">~{formatTime(cooldownSeconds)}</span>
              </>
            ) : (
              <>
                <span className="text-gray-500">{formatTime(activeSeconds)}</span>
                <span className="text-gray-700 mx-0.5">/</span>
                <span className={remaining <= 120 && isActive ? 'text-red-400' : isActive ? 'text-accent-orange' : 'text-gray-600'}>
                  {formatTime(remaining)}
                </span>
              </>
            )}
          </span>
        </div>

        {/* Time progress bar - remaining life / destroy progress */}
        <div className="flex-1 min-w-0 max-w-xs">
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            {isDestroying ? (
              <div
                className="h-1.5 rounded-full transition-all duration-1000 relative"
                style={{
                  width: `${destroyPercent}%`,
                  background: 'linear-gradient(90deg, #f97316, #ef4444)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            ) : (
              <div
                className="h-1.5 rounded-full transition-all duration-1000 relative"
                style={{
                  width: `${remainPercent}%`,
                  background: remainPercent < 10 ? '#ef4444' : remainPercent < 30 ? '#eab308' : '#6366f1',
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            )}
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
            <span className="text-gray-500">{ec2Total ?? '?'}</span>
          </span>
          <div className="w-20 bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500 relative"
              style={{
                width: ec2Total ? `${(runningCount / ec2Total) * 100}%` : '0%',
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

function getPhaseLabel(phase: string, infraStatus: string): string {
  switch (phase) {
    case 'idle': return 'Ready';
    case 'connecting': return 'Syncing...';
    case 'connected': {
      switch (infraStatus) {
        case 'running': return 'Session Active';
        case 'cooldown': return 'Cooldown';
        case 'available': return 'Available';
        case 'limit_exceeded': return 'Limit Reached';
        default: return 'Connected';
      }
    }
    case 'planning': return 'Planning...';
    case 'planned': return 'Plan Ready';
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
    case 'connecting': return 'bg-purple-500 animate-pulse';
    case 'connected': return 'bg-blue-500';
    case 'planning': return 'bg-indigo-500 animate-pulse';
    case 'planned': return 'bg-blue-400';
    case 'triggering': return 'bg-indigo-500 animate-pulse';
    case 'applying': return 'bg-amber-500 animate-pulse';
    case 'running': return 'bg-green-500 animate-pulse';
    case 'destroying': return 'bg-orange-500 animate-pulse';
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'running': return 'bg-green-900/50 text-green-400 border border-green-700/50';
    case 'cooldown': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50';
    case 'available': return 'bg-blue-900/50 text-blue-400 border border-blue-700/50';
    case 'limit_exceeded': return 'bg-red-900/50 text-red-400 border border-red-700/50';
    default: return 'bg-gray-800 text-gray-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'running': return 'ACTIVE';
    case 'cooldown': return 'COOLDOWN';
    case 'available': return 'READY';
    case 'limit_exceeded': return 'LIMIT';
    default: return status.toUpperCase();
  }
}
