import { useState, useRef, useEffect } from 'react';
import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraGuide } from '../components/infra/InfraGuide';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { ViewerModal } from '../components/infra/ViewerModal';
import { useInfraStore } from '../stores/useInfraStore';

export type ViewerTab =
  | 'overview' | 'infra-doc' | 'platform'
  | 'ecommerce' | 'cashgw' | 'payment' | 'hamsterpg'
  | 'internal-admin' | 'content-creator'
  | 'architecture' | 'topology' | 'report';

interface SidebarItem {
  key: ViewerTab;
  label: string;
  desc: string;
  color: string;
  activeColor: string;
}

interface SidebarGroup {
  group: string;
  groupColor: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    group: '문서',
    groupColor: 'text-emerald-600',
    items: [
      { key: 'overview', label: '개요', desc: '프로젝트 소개', color: 'text-emerald-500', activeColor: 'bg-emerald-500/10 border-emerald-500' },
      { key: 'infra-doc', label: '인프라', desc: 'Terraform & 배포', color: 'text-emerald-500', activeColor: 'bg-emerald-500/10 border-emerald-500' },
      { key: 'platform', label: '플랫폼', desc: 'Keycloak, Kafka, Grafana', color: 'text-emerald-500', activeColor: 'bg-emerald-500/10 border-emerald-500' },
    ],
  },
  {
    group: '뷰어',
    groupColor: 'text-blue-600',
    items: [
      { key: 'architecture', label: '아키텍처', desc: '시스템 구성도', color: 'text-blue-500', activeColor: 'bg-blue-500/10 border-blue-500' },
      { key: 'topology', label: '이벤트 플로우', desc: 'Kafka 토폴로지', color: 'text-blue-500', activeColor: 'bg-blue-500/10 border-blue-500' },
      { key: 'report', label: '플랜 리포트', desc: 'terraform plan', color: 'text-blue-500', activeColor: 'bg-blue-500/10 border-blue-500' },
    ],
  },
  {
    group: '서비스',
    groupColor: 'text-amber-600',
    items: [
      { key: 'ecommerce', label: '이커머스', desc: '벤더 SaaS 쇼핑몰', color: 'text-amber-500', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'cashgw', label: '캐시 게이트웨이', desc: '결제 방화벽', color: 'text-amber-500', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'payment', label: '페이먼트', desc: 'Reactive + ES', color: 'text-amber-500', activeColor: 'bg-amber-500/10 border-amber-500' },
      { key: 'hamsterpg', label: '햄스터 PG', desc: 'PG 시뮬레이터', color: 'text-amber-500', activeColor: 'bg-amber-500/10 border-amber-500' },
    ],
  },
  {
    group: '앱',
    groupColor: 'text-pink-600',
    items: [
      { key: 'internal-admin', label: '어드민', desc: '운영 대시보드', color: 'text-pink-500', activeColor: 'bg-pink-500/10 border-pink-500' },
      { key: 'content-creator', label: '콘텐츠 크리에이터', desc: '프로모션 관리', color: 'text-pink-500', activeColor: 'bg-pink-500/10 border-pink-500' },
    ],
  },
];

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
          {SIDEBAR_GROUPS.map((group) => (
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
