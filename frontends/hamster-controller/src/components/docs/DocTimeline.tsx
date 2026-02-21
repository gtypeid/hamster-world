import type { ReactNode } from 'react';
import { highlightChildren } from './ServiceDocLayout';

/* ── Timeline Component for Design Decision Stories ── */

export interface TimelineStage {
  label: string;
  /** 'problem' | 'attempt' | 'limitation' | 'resolution' | 'result' */
  type: 'problem' | 'attempt' | 'limitation' | 'resolution' | 'result';
  content: ReactNode;
}

export interface TimelineStory {
  /** 타임라인 제목 */
  title: string;
  /** 선택적 부제 */
  subtitle?: string;
  stages: TimelineStage[];
}

const STAGE_COLORS: Record<TimelineStage['type'], { dot: string; line: string; label: string; bg: string; border?: string }> = {
  problem:    { dot: 'bg-red-400',    line: 'border-red-800/40',    label: 'text-red-400',    bg: 'bg-red-500/[0.04]' },
  attempt:    { dot: 'bg-amber-400',  line: 'border-amber-800/40',  label: 'text-amber-400',  bg: 'bg-amber-500/[0.04]' },
  limitation: { dot: 'bg-orange-400', line: 'border-orange-800/40', label: 'text-orange-400', bg: 'bg-orange-500/[0.04]' },
  resolution: { dot: 'bg-emerald-400', line: 'border-emerald-800/40', label: 'text-emerald-400', bg: 'bg-emerald-500/[0.04]' },
  result:     { dot: 'bg-blue-400',   line: 'border-blue-800/40',   label: 'text-blue-400',   bg: 'bg-blue-500/[0.07]', border: 'border border-blue-500/20' },
};

const STAGE_LABELS: Record<TimelineStage['type'], string> = {
  problem: '문제',
  attempt: '시도',
  limitation: '한계',
  resolution: '해결',
  result: '결과',
};

export function DocTimeline({ story, headless }: { story: TimelineStory; headless?: boolean }) {
  return (
    <div className="mb-8">
      {/* Story header — headless 모드에서는 subtitle만 표시 (title은 DocBlock이 담당) */}
      {!headless && (
        <div className="mb-5">
          <div className="text-[15px] font-bold text-gray-200">{story.title}</div>
          {story.subtitle && (
            <div className="text-xs text-gray-500 mt-1">{story.subtitle}</div>
          )}
        </div>
      )}
      {headless && story.subtitle && (
        <div className="text-sm text-gray-500 mb-5">{story.subtitle}</div>
      )}

      {/* Timeline */}
      <div className="relative ml-1">
        {story.stages.map((stage, i) => {
          const colors = STAGE_COLORS[stage.type];
          const isLast = i === story.stages.length - 1;

          return (
            <div key={i} className="relative flex gap-4 pb-6">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ring-2 ring-[#0a1020] shrink-0 mt-1.5`} />
                {!isLast && (
                  <div className={`w-px flex-1 border-l ${colors.line} mt-1`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 rounded-lg ${colors.bg} ${colors.border ?? ''} px-4 py-3 -mt-0.5`}>
                {/* Stage label + custom label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${colors.label}`}>
                    {STAGE_LABELS[stage.type]}
                  </span>
                  <span className="text-sm font-medium text-gray-300">{stage.label}</span>
                </div>
                {/* Body */}
                <div className="text-base text-gray-400 leading-relaxed">
                  {typeof stage.content === 'string' ? highlightChildren(stage.content) : stage.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
