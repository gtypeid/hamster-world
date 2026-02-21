import { DocHeading } from './ServiceDocLayout';
import { ALL_TABS } from '../infra/viewerTabs';
import type { ViewerTab } from '../infra/viewerTabs';

/* ── Data types ── */

export interface ExternalRef {
  service: ViewerTab;
  desc: string;
  /** 이 외부 서비스가 해당 컨텍스트의 진실의 원천인 경우 */
  isSourceOfTruth?: boolean;
}

export interface ContextItem {
  name: string;
  service: ViewerTab;
  detail: string;
  externals?: ExternalRef[];
  children?: ContextItem[];
}

export interface BoundedContextData {
  contexts: ContextItem[];
}

/* ── Helpers ── */

function ServiceTag({ tabKey, muted }: { tabKey: ViewerTab; muted?: boolean }) {
  const tab = ALL_TABS.find((t) => t.key === tabKey);
  if (!tab) return null;
  return (
    <span
      className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
        muted
          ? 'text-gray-400 bg-gray-800/60 border-gray-600'
          : `${tab.color} bg-current/10 border-current/20`
      }`}
    >
      {tab.label}
    </span>
  );
}

/* ── Renderer ── */

export function BoundedContextSection({ data }: { data: BoundedContextData }) {
  return (
    <div className="space-y-6">
      <DocHeading>바운디드 컨텍스트</DocHeading>

      <div className="space-y-3 pl-4">
        {data.contexts.map((ctx) => {
          const hasExternalSot = ctx.externals?.some((e) => e.isSourceOfTruth);
          return (
          <div key={ctx.name}>
            {/* Main card */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/30 border-b border-gray-800">
                <span className="text-blue-400 font-mono font-semibold text-sm">{ctx.name}</span>
                <ServiceTag tabKey={ctx.service} muted={hasExternalSot} />
              </div>

              {/* Card body */}
              <div className="px-4 py-3">
                <div className={`text-[15px] leading-relaxed ${
                  hasExternalSot ? 'text-gray-500' : 'text-gray-300'
                }`}>{ctx.detail}</div>

                {/* External references */}
                {ctx.externals && ctx.externals.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-800/60 space-y-1.5">
                    {ctx.externals.map((ext) => (
                      <div key={ext.service} className="flex items-start gap-2">
                        <ServiceTag tabKey={ext.service} muted={!ext.isSourceOfTruth} />
                        <span className={`text-[15px] leading-relaxed pt-0.5 ${
                          ext.isSourceOfTruth ? 'text-gray-300' : 'text-gray-500'
                        }`}>{ext.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Children: ㄴ connected cards below */}
            {ctx.children && ctx.children.length > 0 && (
              <div className="ml-5">
                {ctx.children.map((child, ci) => {
                  const isLast = ci === (ctx.children!.length - 1);
                  return (
                    <div key={child.name} className="flex items-stretch">
                      {/* ㄴ connector */}
                      <div className="relative shrink-0 w-5">
                        {/* Vertical line from top */}
                        <div className={`absolute left-0 top-0 w-px bg-gray-700 ${isLast ? 'h-5' : 'h-full'}`} />
                        {/* Horizontal line */}
                        <div className="absolute left-0 top-5 h-px w-full bg-gray-700" />
                      </div>

                      {/* Child card */}
                      {(() => {
                        const childHasExternalSot = child.externals?.some((e) => e.isSourceOfTruth);
                        const childMuted = hasExternalSot || childHasExternalSot;
                        return (
                        <div className="flex-1 mt-2 mb-0.5 rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 border-b border-gray-800">
                            <span className="text-blue-400 font-mono text-sm font-semibold">{child.name}</span>
                            <ServiceTag tabKey={child.service} muted={childMuted} />
                          </div>
                          <div className="px-3 py-2.5">
                            <div className={`text-[15px] leading-relaxed ${
                              childMuted ? 'text-gray-500' : 'text-gray-300'
                            }`}>{child.detail}</div>

                            {child.externals && child.externals.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-gray-800/60 space-y-1.5">
                                {child.externals.map((ext) => (
                                  <div key={ext.service} className="flex items-start gap-2">
                                    <ServiceTag tabKey={ext.service} muted={!ext.isSourceOfTruth} />
                                    <span className={`text-[15px] leading-relaxed pt-0.5 ${
                                      ext.isSourceOfTruth ? 'text-gray-300' : 'text-gray-500'
                                    }`}>{ext.desc}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
