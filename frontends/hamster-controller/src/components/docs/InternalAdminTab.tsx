import { ServiceDocLayout } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        {/* TODO: 내용 작성 예정 */}
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        {/* TODO: 내용 작성 예정 */}
      </div>
    ),
  },
  {
    key: 'screen',
    label: '화면',
    content: (
      <div className="space-y-4">
        {/* TODO: 내용 작성 예정 */}
      </div>
    ),
  },
];

export function InternalAdminTab() {
  return (
    <ServiceDocLayout
      title="어드민"
      sections={sections}
    />
  );
}
