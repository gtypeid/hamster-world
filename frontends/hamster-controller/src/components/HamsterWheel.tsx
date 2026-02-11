import { useEffect, useState } from 'react';

interface HamsterWheelProps {
  isRunning: boolean;
  isExhausted?: boolean;
}

export function HamsterWheel({ isRunning, isExhausted = false }: HamsterWheelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isRunning || isExhausted) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 10) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, isExhausted]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        {/* 챗바퀴 */}
        <div
          className="absolute inset-0 border-8 border-gray-700 rounded-full transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            borderStyle: 'dashed',
          }}
        >
          {/* 챗바퀴 살대 */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-700 -translate-x-1/2" />
          <div
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 45deg, transparent, transparent 45deg, #374151 45deg, #374151 50deg, transparent 50deg)',
            }}
          />
        </div>

        {/* 햄스터 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl transform transition-transform duration-300">
            {isExhausted ? '😴' : isRunning ? '🐹' : '🐹'}
          </div>
        </div>
      </div>

      {/* 상태 텍스트 */}
      <div className="text-center">
        {isExhausted ? (
          <p className="text-yellow-500 font-mono text-sm">
            💤 Time Limit Exceeded
          </p>
        ) : isRunning ? (
          <p className="text-green-500 font-mono text-sm animate-pulse">
            ⚡ GitHub Actions Running...
          </p>
        ) : (
          <p className="text-gray-500 font-mono text-sm">
            ⏸️ Standby
          </p>
        )}
      </div>
    </div>
  );
}
