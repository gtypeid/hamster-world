import { useState, useRef, useEffect } from 'react';
import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraGuide } from '../components/infra/InfraGuide';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { PlanReportModal } from '../components/infra/PlanReportModal';
import { SessionBar } from '../components/infra/SessionBar';
import { useInfraStore } from '../stores/useInfraStore';

type ViewerKey = 'report' | 'architecture' | 'topology';

const VIEWER_ITEMS: { key: ViewerKey; label: string; desc: string; color: string; activeColor: string }[] = [
  {
    key: 'architecture',
    label: 'Architecture',
    desc: 'System diagram',
    color: 'text-purple-500',
    activeColor: 'bg-purple-500/10 border-purple-500',
  },
  {
    key: 'topology',
    label: 'Event Flow',
    desc: 'Kafka topology',
    color: 'text-amber-500',
    activeColor: 'bg-amber-500/10 border-amber-500',
  },
  {
    key: 'report',
    label: 'Plan Report',
    desc: 'terraform plan',
    color: 'text-blue-500',
    activeColor: 'bg-blue-500/10 border-blue-500',
  },
];

export function Infrastructure() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const planResult = useInfraStore((s) => s.planResult);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<ViewerKey>('report');
  const prevPhaseRef = useRef(sessionPhase);

  // planned phase 진입 시 자동으로 Plan Report 모달 열기
  useEffect(() => {
    if (sessionPhase === 'planned' && prevPhaseRef.current !== 'planned') {
      setInitialTab('report');
      setModalOpen(true);
    }
    prevPhaseRef.current = sessionPhase;
  }, [sessionPhase]);

  const openViewer = (tab: ViewerKey) => {
    setInitialTab(tab);
    setModalOpen(true);
  };

  const hasPlan = !!planResult;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Top bar */}
      <div className="shrink-0 border-b border-dark-border bg-dark-sidebar">
        <SessionBar />
      </div>

      {/* Guide panel */}
      <div className="shrink-0">
        <InfraGuide />
      </div>

      {/* Main area: Left sidebar nav + Center flow */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Viewer navigation */}
        <div className="shrink-0 w-44 bg-[#080e1a] border-r border-dark-border flex flex-col py-3 px-2 gap-1.5">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">
            Viewer
          </div>
          {VIEWER_ITEMS.map((item) => {
            const isIdle = sessionPhase === 'idle';
            const showReady = item.key === 'report' && hasPlan;
            const showClick = item.key === 'architecture' && isIdle && !hasPlan;
            const highlight = showReady || showClick;

            return (
              <button
                key={item.key}
                onClick={() => openViewer(item.key)}
                className={`group w-full text-left rounded-lg border px-3 py-2.5 transition-all hover:bg-white/[0.03] ${
                  highlight
                    ? `${item.activeColor} border-opacity-60`
                    : 'border-transparent hover:border-gray-800'
                }`}
              >
                <div className={`text-xs font-semibold ${item.color} group-hover:brightness-125`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">{item.desc}</div>
                {showReady && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-500 font-medium">Ready</span>
                  </div>
                )}
                {showClick && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[10px] text-purple-400 font-medium">Click</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Center - ReactFlow */}
        <div className="flex-1 min-h-0">
          <InfraFlowView />
        </div>
      </div>

      {/* Bottom - logs */}
      <div className="shrink-0 h-52 border-t border-dark-border">
        <InfraLogPanel />
      </div>

      {/* Viewer Modal */}
      {modalOpen && (
        <PlanReportModal
          initialTab={initialTab}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
