import { useState, useRef, useEffect } from 'react';
import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraGuide } from '../components/infra/InfraGuide';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { PlanReportModal } from '../components/infra/PlanReportModal';
import { SessionBar } from '../components/infra/SessionBar';
import { useInfraStore } from '../stores/useInfraStore';

export function Infrastructure() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const planResult = useInfraStore((s) => s.planResult);
  const [modalOpen, setModalOpen] = useState(false);
  const prevPhaseRef = useRef(sessionPhase);

  // planned phase 진입 시 자동으로 모달 열기
  useEffect(() => {
    if (sessionPhase === 'planned' && prevPhaseRef.current !== 'planned') {
      setModalOpen(true);
    }
    prevPhaseRef.current = sessionPhase;
  }, [sessionPhase]);

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

      {/* Plan Report 다시 보기 버튼 */}
      {hasPlan && !modalOpen && (
        <div className="shrink-0 flex items-center px-5 py-1.5 bg-[#080e1a] border-b border-dark-border">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="font-semibold">Infrastructure Report</span>
            <span className="text-gray-600">- 클릭하여 다시 보기</span>
          </button>
        </div>
      )}

      {/* Center - ReactFlow */}
      <div className="flex-1 min-h-0">
        <InfraFlowView />
      </div>

      {/* Bottom - logs */}
      <div className="shrink-0 h-52 border-t border-dark-border">
        <InfraLogPanel />
      </div>

      {/* Plan Report Modal */}
      {modalOpen && hasPlan && (
        <PlanReportModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
