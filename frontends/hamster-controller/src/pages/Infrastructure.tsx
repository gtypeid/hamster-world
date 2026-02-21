import { useState, useRef, useEffect } from 'react';
import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraGuide } from '../components/infra/InfraGuide';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { ViewerModal } from '../components/infra/ViewerModal';
import { useInfraStore } from '../stores/useInfraStore';
import { TAB_GROUPS } from '../components/infra/viewerTabs';
import type { ViewerTab } from '../components/infra/viewerTabs';

export function Infrastructure() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const planResult = useInfraStore((s) => s.planResult);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<ViewerTab>('report');
  const prevPhaseRef = useRef(sessionPhase);

  // planned phase 진입 시 자동으로 Plan Report 모달 열기
  useEffect(() => {
    if (sessionPhase === 'planned' && prevPhaseRef.current !== 'planned') {
      setInitialTab('report');
      setModalOpen(true);
    }
    prevPhaseRef.current = sessionPhase;
  }, [sessionPhase]);

  const openViewer = (tab: ViewerTab) => {
    setInitialTab(tab);
    setModalOpen(true);
  };

  const hasPlan = !!planResult;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Guide panel */}
      <div className="shrink-0">
        <InfraGuide />
      </div>

      {/* Main area: Left sidebar nav + Center flow */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Grouped navigation */}
        <div className="shrink-0 w-48 bg-[#080e1a] border-r border-dark-border flex flex-col py-2 px-2 gap-0 overflow-y-auto">
          {TAB_GROUPS.map((group) => (
            <div key={group.group} className="mb-1">
              <div className={`text-base font-bold uppercase tracking-widest px-2 pt-3 pb-1.5 ${group.groupColor}`}>
                {group.group}
              </div>
              {group.items.map((item) => {
                const isIdle = sessionPhase === 'idle';
                const showReady = item.key === 'report' && hasPlan;
                const showClick = item.key === 'overview' && isIdle && !hasPlan;
                const highlight = showReady || showClick;

                return (
                  <button
                    key={item.key}
                    onClick={() => openViewer(item.key)}
                    className={`group w-full text-left rounded-lg border px-3 py-2 transition-all hover:bg-white/[0.03] ${
                      highlight
                        ? `${item.activeColor} border-opacity-60`
                        : 'border-transparent hover:border-gray-800'
                    }`}
                  >
                    <div className={`text-[13px] font-semibold ${item.color} group-hover:brightness-125`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{item.desc}</div>
                    {showReady && (
                      <div className="flex items-center gap-1.5 mt-1.5" style={{ animation: 'click-blink 0.8s ease-in-out infinite' }}>
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-[11px] text-green-400 font-bold">준비됨</span>
                      </div>
                    )}
                    {showClick && (
                      <div className="flex items-center gap-1.5 mt-1.5" style={{ animation: 'click-blink 1.3s ease-in-out infinite' }}>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wide">Click</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
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
        <ViewerModal
          initialTab={initialTab}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
