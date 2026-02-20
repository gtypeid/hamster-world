import { SessionBar } from '../infra/SessionBar';
import { useInfraStore } from '../../stores/useInfraStore';

interface HeaderProps {
  onHelpClick?: () => void;
}

export function Header({ onHelpClick }: HeaderProps) {
  return (
    <header className="bg-dark-sidebar border-b border-dark-border relative">
      {/* Accent top line */}
      <AccentLine />

      <div className="px-5 py-4 flex items-center">
        {/* Left: branding + help */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-4xl animate-wiggle">🐹</span>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Hamster Controller
              </h1>
              <p className="text-[10px] text-accent-orange font-medium">
                Infrastructure Control Dashboard
              </p>
            </div>
            <button
              onClick={onHelpClick}
              className="w-7 h-7 rounded-full border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 transition-all flex items-center justify-center text-xs font-extrabold"
              title="Help & Guide"
            >
              ?
            </button>
          </div>
        </div>

        {/* Divider — wide spacing */}
        <div className="w-px h-8 bg-gray-700 shrink-0 mx-12" />

        {/* Right: SessionBar inline */}
        <div className="flex-1 min-w-0">
          <SessionBar inline />
        </div>
      </div>
    </header>
  );
}

/** Accent line that reflects session phase */
function AccentLine() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);

  const isActive = sessionPhase === 'triggering' || sessionPhase === 'applying' || sessionPhase === 'running' || sessionPhase === 'destroying';
  const isDestroying = sessionPhase === 'destroying';

  return (
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
  );
}
