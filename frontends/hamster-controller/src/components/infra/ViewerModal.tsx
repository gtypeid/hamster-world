/**
 * ViewerModal - Unified viewer for docs, services, apps, and infrastructure.
 * Extends the original PlanReportModal with documentation tabs.
 */
import { useState } from 'react';
import { PlanReportModal } from './PlanReportModal';
import { OverviewTab } from '../docs/OverviewTab';
import { InfrastructureTab } from '../docs/InfrastructureTab';
import { PlatformTab } from '../docs/PlatformTab';
import { EcommerceTab } from '../docs/EcommerceTab';
import { CashGatewayTab } from '../docs/CashGatewayTab';
import { PaymentTab } from '../docs/PaymentTab';
import { HamsterPgTab } from '../docs/HamsterPgTab';
import { InternalAdminTab } from '../docs/InternalAdminTab';
import { ContentCreatorTab } from '../docs/ContentCreatorTab';
import type { ViewerTab } from '../../pages/Infrastructure';

const VIEWER_LEGACY_TABS = new Set(['architecture', 'topology', 'report']);

interface TabDef {
  key: ViewerTab;
  label: string;
  group: string;
  color: string;
  dotColor: string;
}

const TAB_GROUPS: { group: string; groupColor: string; tabs: TabDef[] }[] = [
  {
    group: '문서',
    groupColor: 'text-emerald-500',
    tabs: [
      { key: 'overview', label: '개요', group: '문서', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
      { key: 'infra-doc', label: '인프라', group: '문서', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
      { key: 'platform', label: '플랫폼', group: '문서', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    ],
  },
  {
    group: '뷰어',
    groupColor: 'text-blue-500',
    tabs: [
      { key: 'architecture', label: '아키텍처', group: '뷰어', color: 'text-blue-400', dotColor: 'bg-blue-400' },
      { key: 'topology', label: '이벤트 플로우', group: '뷰어', color: 'text-blue-400', dotColor: 'bg-blue-400' },
      { key: 'report', label: '플랜 리포트', group: '뷰어', color: 'text-blue-400', dotColor: 'bg-blue-400' },
    ],
  },
  {
    group: '서비스',
    groupColor: 'text-amber-500',
    tabs: [
      { key: 'ecommerce', label: '이커머스', group: '서비스', color: 'text-amber-400', dotColor: 'bg-amber-400' },
      { key: 'cashgw', label: '캐시 게이트웨이', group: '서비스', color: 'text-amber-400', dotColor: 'bg-amber-400' },
      { key: 'payment', label: '페이먼트', group: '서비스', color: 'text-amber-400', dotColor: 'bg-amber-400' },
      { key: 'hamsterpg', label: '햄스터 PG', group: '서비스', color: 'text-amber-400', dotColor: 'bg-amber-400' },
    ],
  },
  {
    group: '앱',
    groupColor: 'text-pink-500',
    tabs: [
      { key: 'internal-admin', label: '어드민', group: '앱', color: 'text-pink-400', dotColor: 'bg-pink-400' },
      { key: 'content-creator', label: '콘텐츠 크리에이터', group: '앱', color: 'text-pink-400', dotColor: 'bg-pink-400' },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

export function ViewerModal({ initialTab, onClose }: { initialTab?: ViewerTab; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ViewerTab>(initialTab ?? 'overview');

  const isViewerTab = VIEWER_LEGACY_TABS.has(activeTab);
  const currentDef = ALL_TABS.find((t) => t.key === activeTab);

  // Shared tab bar used by both doc view and viewer overlay
  const tabBar = (
    <div className="shrink-0 bg-[#080e1a] border-b border-gray-800">
      <div className="flex items-start justify-between px-4 pt-2 overflow-x-auto">
        <div className="flex items-start gap-0">
          {TAB_GROUPS.map((group, gi) => {
            const isGroupActive = group.tabs.some((t) => t.key === activeTab);
            return (
            <div key={group.group} className="flex items-start">
              {gi > 0 && <div className="w-px h-10 bg-gray-800 mx-2 mt-2" />}
              <div className="flex flex-col">
                <span className={`text-lg font-bold uppercase tracking-widest px-3 pb-1.5 transition-all ${group.groupColor} ${isGroupActive ? 'opacity-100' : 'opacity-30'}`}>{group.group}</span>
                <div className="flex items-center">
                  {group.tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                          isActive
                            ? `${tab.color} border-b-[3px] border-current bg-current/10`
                            : 'text-gray-500 border-b-[3px] border-transparent hover:text-gray-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'opacity-100' : 'opacity-30'} ${tab.dotColor}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 mt-2 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-lg shrink-0 ml-2"
        >
          &times;
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1120] border border-gray-700/60 rounded-xl shadow-2xl shadow-black/50 w-[96%] h-[94vh] flex flex-col overflow-hidden">

        {/* Shared tab header */}
        {tabBar}

        {/* Body: doc content or PlanReportModal content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isViewerTab ? (
            <PlanReportModal
              initialTab={activeTab as 'architecture' | 'topology' | 'report'}
              embedded
            />
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'infra-doc' && <InfrastructureTab />}
              {activeTab === 'platform' && <PlatformTab />}
              {activeTab === 'ecommerce' && <EcommerceTab />}
              {activeTab === 'cashgw' && <CashGatewayTab />}
              {activeTab === 'payment' && <PaymentTab />}
              {activeTab === 'hamsterpg' && <HamsterPgTab />}
              {activeTab === 'internal-admin' && <InternalAdminTab />}
              {activeTab === 'content-creator' && <ContentCreatorTab />}
            </>
          )}
        </div>

        {/* Footer hint */}
        {currentDef && (
          <div className="shrink-0 flex items-center px-6 py-2 border-t border-gray-800 bg-[#080e1a]">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentDef.color}`}>
              {currentDef.group}
            </span>
            <span className="text-[10px] text-gray-600 ml-2">&mdash; {currentDef.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
