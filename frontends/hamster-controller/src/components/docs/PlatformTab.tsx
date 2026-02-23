import { ServiceDocLayout, DocBlock } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '플랫폼 의도' },
      { key: 'svc-desc', label: '플랫폼 설명' },
      { key: 'svc-design', label: '핵심 설계 및 코드' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        {/* 플랫폼 의도 */}
        <DocBlock id="svc-intent" title="플랫폼 의도">
          {/* TODO: 내용 작성 예정 */}
        </DocBlock>

        {/* 플랫폼 설명 */}
        <DocBlock id="svc-desc" title="플랫폼 설명">
          {/* TODO: 내용 작성 예정 */}
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          {/* TODO: 내용 작성 예정 */}
        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          {/* TODO: 내용 작성 예정 */}
        </DocBlock>
      </div>
    ),
  },
];

export function PlatformTab() {
  return (
    <ServiceDocLayout
      title="플랫폼"
      sections={sections}
    />
  );
}
