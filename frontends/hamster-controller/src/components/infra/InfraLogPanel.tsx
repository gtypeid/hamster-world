import { useEffect, useRef } from 'react';
import { useInfraStore, type InfraLog } from '../../stores/useInfraStore';

export function InfraLogPanel() {
  const logs = useInfraStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="bg-[#0c1222] flex flex-col h-full">
      {/* Header - compact */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-dark-border/50 bg-dark-sidebar/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Runtime Log
          </span>
          {logs.length > 0 && (
            <span className="text-[9px] bg-dark-hover text-gray-500 px-1.5 py-0.5 rounded font-mono">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Log entries - scrollable horizontal-friendly */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-1 font-mono text-[11px] space-y-px"
        style={{ minHeight: 0 }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center h-full text-gray-600 text-xs">
            Waiting for session to start...
          </div>
        ) : (
          logs.map((log, idx) => (
            <LogEntry key={idx} log={log} />
          ))
        )}
      </div>
    </div>
  );
}

function LogEntry({ log }: { log: InfraLog }) {
  const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false });

  const levelColor = {
    info:    'text-blue-400',
    success: 'text-green-400',
    error:   'text-red-400',
    warn:    'text-yellow-400',
  }[log.level];

  const levelIcon = {
    info:    '>',
    success: '+',
    error:   '!',
    warn:    '~',
  }[log.level];

  return (
    <div className="flex gap-2 leading-snug hover:bg-white/[0.02] px-1 rounded whitespace-nowrap">
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className={`${levelColor} shrink-0`}>{levelIcon}</span>
      {log.instanceId && (
        <span className="text-accent-orange shrink-0">[{log.instanceId}]</span>
      )}
      <span className="text-gray-300">{log.message}</span>
    </div>
  );
}
