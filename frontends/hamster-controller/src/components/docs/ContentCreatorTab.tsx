import { ServiceDocLayout, DocHeading, DocParagraph, DocCard, DocPlaceholder } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    content: (
      <div className="space-y-4">
        <DocHeading>Content Creator</DocHeading>
        <DocParagraph>
          프로모션/시즌/쿠폰 관리 도구. Progression, Payment, Delivery 서비스와 연동됩니다.
        </DocParagraph>
        <DocCard title="Connected Services">
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-purple-400 font-mono w-28 shrink-0">Progression</span>
              <span>쿼타, 아카이브, 시즌 프로모션 관리</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-mono w-28 shrink-0">Payment</span>
              <span>결제 관련 프로모션</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-mono w-28 shrink-0">Delivery</span>
              <span>라이더 프로모션, 배달 관리</span>
            </div>
          </div>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'design',
    label: '설계 의도',
    content: (
      <div className="space-y-4">
        <DocHeading>Why: Design Intent</DocHeading>
        <DocParagraph>
          운영팀이 코드 변경 없이 프로모션/쿠폰/시즌 이벤트를 관리할 수 있는 도구.
          각 서비스의 프로모션 관련 API를 집약합니다.
        </DocParagraph>
        <DocCard title="Key Views">
          <div className="space-y-2 text-xs text-gray-400">
            <div>쿼타 관리 - Quota Management</div>
            <div>시즌 프로모션 - Season Promotions</div>
            <div>쿠폰 관리 - Coupon Management</div>
            <div>라이더 프로모션 - Rider Promotions</div>
          </div>
        </DocCard>
      </div>
    ),
  },
  {
    key: 'screen',
    label: '화면',
    content: (
      <div className="space-y-4">
        <DocHeading>Screen</DocHeading>
        <DocPlaceholder text="Content Creator 스크린샷 (추후 추가)" />
      </div>
    ),
  },
];

export function ContentCreatorTab() {
  return (
    <ServiceDocLayout
      title="콘텐츠 크리에이터"
      badge="프로모션"
      badgeColor="text-pink-400 bg-pink-500/10 border-pink-500/20"
      sections={sections}
    />
  );
}
