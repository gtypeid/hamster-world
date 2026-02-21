import { DocHeading, DocSubHeading } from './ServiceDocLayout';

/* ── Data types ── */

export interface PublishEvent {
  name: string;
  desc: string;
}

export interface ConsumeEvent {
  name: string;
  action: string;
}

export interface ConsumeGroup {
  topic: string;
  events: ConsumeEvent[];
}

export interface ServiceFlowData {
  publishTopic: string;
  publishes: PublishEvent[];
  consumes: ConsumeGroup[];
}

/* ── Renderer ── */

export function ServiceFlowSection({ data }: { data: ServiceFlowData }) {
  return (
    <div className="space-y-6">
      <DocHeading>카프카 토폴로지</DocHeading>

      {/* 발행 이벤트 */}
      <div>
        <DocSubHeading sub={data.publishTopic}>발행 이벤트</DocSubHeading>
        <div className="space-y-3 text-sm text-gray-400 pl-4">
          {data.publishes.map((event, i) => (
            <div key={event.name} className={i > 0 ? 'border-t border-gray-800 pt-3' : ''}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 font-mono font-semibold">{event.name}</span>
              </div>
              <div className="pl-3 text-gray-500">{event.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-700/50" />

      {/* 소모 이벤트 */}
      <div>
        <DocSubHeading sub={`${data.consumes.length}개 토픽`}>소모 이벤트</DocSubHeading>
        <div className="space-y-4 text-sm text-gray-400 pl-4">
          {data.consumes.map((group, gi) => (
            <div key={group.topic}>
              {gi > 0 && <div className="border-t border-gray-800 pt-3 mt-1" />}
              <div className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">
                {group.topic}
              </div>
              <div className="space-y-2">
                {group.events.map((event, ei) => (
                  <div key={event.name} className={ei > 0 ? 'border-t border-gray-800/50 pt-2' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 font-mono font-semibold">{event.name}</span>
                    </div>
                    <div className="pl-3">
                      <div>{event.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
