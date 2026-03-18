import { useState, useEffect } from 'react';
import {
  useInfraStore,
  selectRunningCount,
  selectTotalInstances,
} from '../../stores/useInfraStore';

export function InfraProgressBar() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const sessionStartedAt = useInfraStore((s) => s.sessionStartedAt);
  const sessionDurationMin = useInfraStore((s) => s.sessionDurationMin);
  const runningCount = useInfraStore(selectRunningCount);
  const totalInstances = useInfraStore(selectTotalInstances);

  const [elapsed, setElapsed] = useState(0); // seconds

  // Timer
  useEffect(() => {
    if (!sessionStartedAt || sessionPhase === 'idle' || sessionPhase === 'completed') {
      setElapsed(0);
      return;
    }

    const startTime = new Date(sessionStartedAt).getTime();

    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt, sessionPhase]);

  const totalSeconds = sessionDurationMin * 60;
  const remaining = Math.max(totalSeconds - elapsed, 0);
  const remainPercent = totalSeconds > 0 ? Math.max((remaining / totalSeconds) * 100, 0) : 100;
  const instancePercent = (runningCount / totalInstances) * 100;

  const phaseLabel = getPhaseLabel(sessionPhase);
  const phaseColor = getPhaseColor(sessionPhase);

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
      {/* Session Timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${phaseColor}`} />
          <span className="text-sm font-medium text-gray-300">{phaseLabel}</span>
        </div>
        <div className="font-mono text-lg text-gray-200">
          <span className="text-gray-400">{formatTime(totalSeconds)}</span>
          <span className="text-gray-600"> / </span>
          <span className={remaining <= 120 && sessionPhase !== 'idle' ? 'text-red-400' : sessionPhase !== 'idle' ? 'text-accent-orange' : 'text-gray-500'}>
            {formatTime(remaining)}
          </span>
        </div>
      </div>

      {/* Time progress bar - remaining life */}
      <div className="w-full bg-dark-hover rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{
            width: `${remainPercent}%`,
            background: remainPercent < 10
              ? '#ef4444'
              : remainPercent < 30
              ? '#eab308'
              : '#6366f1',
          }}
        />
      </div>

      {/* Instance progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Instances</span>
        <span className="text-xs font-mono text-gray-300">
          {runningCount} / {totalInstances} online
        </span>
      </div>

      <div className="w-full bg-dark-hover rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500 relative overflow-hidden"
          style={{
            width: `${instancePercent}%`,
            background: 'linear-gradient(90deg, #16a34a, #4ade80)',
          }}
        >
          {instancePercent > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
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
    case 'triggering': return 'Triggering Workflow...';
    case 'applying': return 'Terraform Apply...';
    case 'running': return 'Infrastructure Online';
    case 'destroying': return 'Terraform Destroy...';
    case 'completed': return 'Session Completed';
    case 'failed': return 'Session Failed';
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
