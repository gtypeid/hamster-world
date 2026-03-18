import { DocHeading, DocSubHeading, DocCallout } from './ServiceDocLayout';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';

/* ── Data types ── */

export interface SecurityGroupData {
  name: string;
  accessLevel: string;
  ports: string;
  color: {
    dot: string;
    name: string;
    badge: string;
    border: string;
    bg: string;
  };
}

export interface InstanceApp {
  name: string;
  port?: string;
  desc?: string;
}

export interface InstanceData {
  name: string;
  desc?: string;
  apps: InstanceApp[];
}

export interface InfraTopologyData {
  diagram: {
    nodes: MiniFlowNode[];
    edges: MiniFlowEdge[];
    height?: number;
  };
  securityGroups: SecurityGroupData[];
  sgCallout?: string;
  instances: InstanceData[];
  instanceCallout?: string;
  instanceNote?: string;
}

/* ── Renderer ── */

export function InfraTopologySection({ data }: { data: InfraTopologyData }) {
  return (
    <div className="space-y-6">
      <DocHeading>인프라 토폴로지</DocHeading>

      {/* 토폴로지 다이어그램 */}
      <div>
        <DocSubHeading>토폴로지 다이어그램</DocSubHeading>
        <DocMiniFlow
          nodes={data.diagram.nodes}
          edges={data.diagram.edges}
          direction="TB"
          height={data.diagram.height}
        />
      </div>

      <div className="border-t border-gray-700/50 my-4" />

      {/* 보안 그룹 */}
      <div>
        <DocSubHeading sub={`${data.securityGroups.length}개 그룹`}>보안 그룹</DocSubHeading>
        <div className="space-y-2 pl-4">
          {data.securityGroups.map((sg) => (
            <div key={sg.name} className={`rounded-lg border ${sg.color.border} ${sg.color.bg} p-3`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-sm ${sg.color.dot}`} />
                <span className={`text-sm font-bold ${sg.color.name}`}>{sg.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${sg.color.badge}`}>{sg.accessLevel}</span>
                <span className="text-xs text-gray-500 ml-2">{sg.ports}</span>
              </div>
            </div>
          ))}
        </div>
        {data.sgCallout && <DocCallout>{data.sgCallout}</DocCallout>}
      </div>

      <div className="border-t border-gray-700/50 my-4" />

      {/* 인스턴스 상세 */}
      <div>
        <DocSubHeading sub={`${data.instances.length}개 인스턴스`}>인스턴스 상세</DocSubHeading>
        {data.instanceNote && (
          <div className="text-sm text-gray-400 mb-4 pl-4">{data.instanceNote}</div>
        )}
        <div className="space-y-3 pl-4">
          {data.instances.map((inst) => (
            <div key={inst.name}>
              {/* Instance header card */}
              <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/30 border-b border-gray-800">
                  <span className="text-blue-400 font-mono font-semibold text-sm">{inst.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border text-emerald-400 bg-emerald-900/20 border-emerald-500/30">EC2 INSTANCE</span>
                </div>
                {inst.desc && (
                  <div className="px-4 py-3 text-[15px] text-gray-300 leading-relaxed">{inst.desc}</div>
                )}
              </div>

              {/* Child apps */}
              {inst.apps.length > 0 && (
                <div className="ml-5">
                  {inst.apps.map((app, ai) => {
                    const isLast = ai === inst.apps.length - 1;
                    return (
                      <div key={app.name} className="flex items-stretch">
                        <div className="relative shrink-0 w-5">
                          <div className={`absolute left-0 top-0 w-px bg-gray-700 ${isLast ? 'h-5' : 'h-full'}`} />
                          <div className="absolute left-0 top-5 h-px w-full bg-gray-700" />
                        </div>
                        <div className="flex-1 mt-2 mb-0.5 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300 font-mono">{app.name}</span>
                            {app.port && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border text-sky-400 bg-sky-900/20 border-sky-500/30">{app.port}</span>
                            )}
                          </div>
                          {app.desc && (
                            <div className={`text-[11px] text-gray-500 mt-1 ${app.desc.includes('\n') ? 'whitespace-pre-line font-mono' : ''}`}>{app.desc}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        {data.instanceCallout && <DocCallout>{data.instanceCallout}</DocCallout>}
      </div>
    </div>
  );
}
