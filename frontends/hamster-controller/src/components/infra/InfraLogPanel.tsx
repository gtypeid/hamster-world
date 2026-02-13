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
    <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border bg-dark-sidebar/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Runtime Log
          </span>
          {logs.length > 0 && (
            <span className="text-[10px] bg-dark-hover text-gray-500 px-1.5 py-0.5 rounded font-mono">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5"
        style={{ minHeight: 0 }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
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
    <div className="flex gap-2 leading-relaxed hover:bg-dark-hover/30 px-1 rounded">
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className={`${levelColor} shrink-0`}>{levelIcon}</span>
      {log.instanceId && (
        <span className="text-accent-orange shrink-0">[{log.instanceId}]</span>
      )}
      <span className="text-gray-300">{log.message}</span>
    </div>
  );
}
