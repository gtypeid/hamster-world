import { ServiceDocLayout, DocBlock, DocParagraph, DocCard } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';
import { ServiceFlowSection } from './ServiceFlowSection';
import type { ServiceFlowData } from './ServiceFlowSection';
import { BoundedContextSection } from './BoundedContextSection';
import type { BoundedContextData } from './BoundedContextSection';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';

/* ── 역할 기반 API ── */

const userStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 150 };
const keycloakStyle = { bg: '#312e81', color: '#c4b5fd', border: '1px solid #6366f1', width: 140 };
const apiPublicStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', width: 200 };
const apiProtectedStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', width: 200 };
const apiMerchantStyle = { bg: '#92400e', color: '#fcd34d', border: '1px solid #d97706', width: 200 };
const apiAdminStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 200 };

const ROLE_API_NODES: MiniFlowNode[] = [
  // 사용자 유형 (왼쪽)
  { id: 'guest', label: '비로그인 사용자', x: 0, y: 0, style: userStyle, sourcePosition: 'right' },
  { id: 'user', label: '일반 사용자', x: 0, y: 90, style: userStyle, sourcePosition: 'right' },
  { id: 'merchant-user', label: '가맹점 사용자', x: 0, y: 180, style: userStyle, sourcePosition: 'right' },
  { id: 'admin-user', label: '관리자', x: 0, y: 270, style: userStyle, sourcePosition: 'right' },
  // Keycloak (중앙)
  { id: 'keycloak', label: 'Keycloak\n(JWT 발급)', x: 240, y: 160, style: keycloakStyle, targetPosition: 'left', sourcePosition: 'right' },
  // API 레이어 (오른쪽)
  { id: 'api-public', label: 'Public API\n상품 카탈로그, 가맹점 조회', x: 480, y: 0, style: apiPublicStyle, targetPosition: 'left' },
  { id: 'api-protected', label: 'Protected API\n장바구니, 주문, 마이페이지', x: 480, y: 90, style: apiProtectedStyle, targetPosition: 'left' },
  { id: 'api-merchant', label: 'Merchant API\n상품 CRUD, 주문 관리, 정산', x: 480, y: 180, style: apiMerchantStyle, targetPosition: 'left' },
  { id: 'api-admin', label: 'Admin API\n전체 관리, 분석 대시보드', x: 480, y: 270, style: apiAdminStyle, targetPosition: 'left' },
];

const ROLE_API_EDGES: MiniFlowEdge[] = [
  // 비로그인 → Public API 직접 접근
  { source: 'guest', target: 'api-public', dashed: true, color: '#475569', label: '인증 없이' },
  // 로그인 사용자 → Keycloak → Protected
  { source: 'user', target: 'keycloak', color: '#6366f1' },
  { source: 'merchant-user', target: 'keycloak', color: '#6366f1' },
  { source: 'admin-user', target: 'keycloak', color: '#6366f1' },
  { source: 'keycloak', target: 'api-protected', color: '#3b82f6', label: 'Role: USER' },
  { source: 'keycloak', target: 'api-merchant', color: '#d97706', label: 'Role: MERCHANT' },
  { source: 'keycloak', target: 'api-admin', color: '#dc2626', label: 'Role: ADMIN' },
];

const ecommerceFlow: ServiceFlowData = {
  publishTopic: 'ecommerce-events',
  publishes: [
    { name: 'OrderCreatedEvent', desc: '새 주문 생성, 결제 프로세스 시작 요청' },
    { name: 'ProductCreatedEvent', desc: '신규 상품 등록, Payment에 재고 초기화 요청' },
    { name: 'StockAdjustmentRequestedEvent', desc: '수동 재고 입고·차감 요청' },
  ],
  consumes: [
    {
      topic: 'payment-events',
      events: [
        { name: 'PaymentConfirmedEvent', action: '주문 상태를 결제 완료로 변경' },
        { name: 'PaymentProcessFailedEvent', action: '주문 상태를 결제 실패로 변경' },
        { name: 'PaymentCancelConfirmedEvent', action: '주문 상태를 취소로 변경' },
        { name: 'OrderStockValidationFailedEvent', action: '재고 부족으로 주문 실패 처리' },
        { name: 'ProductStockSynchronizedEvent', action: '상품 재고 캐시 동기화' },
        { name: 'AccountBalanceSynchronizedEvent', action: '유저 잔액 캐시 동기화' },
      ],
    },
  ],
};

const ecommerceContext: BoundedContextData = {
  contexts: [
    {
      name: 'Order',
      service: 'ecommerce',
      detail: '주문 전표. 사용자가 보는 주문 내역이며, 상태 변경은 페이먼트 이벤트로만 수행된다. 거래의 진실의 원천이 아닌 UI용 전표.',
      externals: [
        { service: 'payment', desc: '주문 상태 변경의 원천. 결제 확정·실패·취소 이벤트를 발행하면 Order 상태가 전이된다', isSourceOfTruth: true },
        { service: 'progression', desc: 'OrderCreatedEvent에 반응하여 소비. 아카이브·쿼타 진행도를 업데이트한다' },
      ],
      children: [
        {
          name: 'OrderItem',
          service: 'ecommerce',
          detail: '주문 내 개별 상품 항목. 상품·수량·가격·판매자 정보를 비정규화하여 저장한다.',
        },
      ],
    },
    {
      name: 'Product',
      service: 'ecommerce',
      detail: '상품 카탈로그. 메타데이터(이름, 설명, 가격)는 이 서비스가 관리하지만, 재고 수량은 읽기 전용 캐시로 이벤트 동기화만 받는다.',
      externals: [
        { service: 'payment', desc: '재고의 진실의 원천. 재고 변동 이벤트를 발행하면 여기서 동기화 받는다', isSourceOfTruth: true },
      ],
    },
    {
      name: 'Account',
      service: 'ecommerce',
      detail: '유저 잔액 읽기 전용 캐시. 잔액 표시 목적으로만 존재하며, 직접 변경하지 않는다.',
      externals: [
        { service: 'payment', desc: '잔액의 진실의 원천. 잔액 동기화 이벤트를 발행하면 여기서 캐시 갱신한다', isSourceOfTruth: true },
      ],
    },
    {
      name: 'Merchant',
      service: 'ecommerce',
      detail: '가맹점 정보. 사업자·스토어·정산 정보를 관리하며, 캐시 게이트웨이 가맹점 식별자와 매핑된다.',
      externals: [
        { service: 'cashgw', desc: '가맹점 식별자(MID)를 발급하는 쪽. 이 서비스는 발급받은 MID를 저장한다' },
      ],
    },
    {
      name: 'CouponPolicy',
      service: 'ecommerce',
      detail: '쿠폰 정책 및 발급 관리. 할인 규칙 템플릿을 정의하고, 유저별 수령·사용 이력을 추적한다.',
      children: [
        {
          name: 'UserCoupon',
          service: 'ecommerce',
          detail: '유저가 수령한 쿠폰 기록. 동일 쿠폰은 1회만 수령 가능하며, 사용 시 불변 이력으로 기록된다.',
        },
      ],
    },
    {
      name: 'Cart',
      service: 'ecommerce',
      detail: '장바구니. 구매 전 상품 임시 저장소로, 주문 생성 시 장바구니 내용이 주문으로 변환된다.',
    },
  ],
};

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '서비스 의도' },
      { key: 'svc-desc', label: '서비스 설명' },
    ],
    content: (
      <div className="space-y-8">
        {/* 서비스 의도 */}
        <DocBlock id="svc-intent" title="서비스 의도">
          <DocParagraph>
            Ecommerce는 사용자 접점의 대부분을 담당하지만,
            자원의 원천을 이 서비스에 둘 수 없다고 판단한 케이스가 많았습니다.
            재고를 두면 결제와 분산 트랜잭션이 필요하고,
            잔액을 두면 정산과 이중 관리가 생기고,
            결제를 두면 PG 프로토콜의 복잡성이 유입됩니다.
          </DocParagraph>
          <DocParagraph>
            결과적으로 Ecommerce는 도메인 이벤트를 발행하고
            그 결과를 반영하는 전표 역할로 수렴했습니다.
          </DocParagraph>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocCard title="역할 기반 API">
            <DocParagraph>
              비로그인 사용자, 로그인 사용자, 가맹점 역할별로 접근 권한과 소비 성격이 다르며,
              역할 기반으로 API를 분리합니다.
            </DocParagraph>
            <DocMiniFlow nodes={ROLE_API_NODES} edges={ROLE_API_EDGES} direction="LR" />
          </DocCard>
          <DocCard title="최종 일관성">
            <DocParagraph>
              상태 변경은 자체적으로 수행하지 않고,
              다른 서비스의 이벤트를 구독 소비하여 최종 일관성을 지향합니다.
            </DocParagraph>
          </DocCard>
          <DocCard title="Bounded Context 확장">
            <DocParagraph>
              유저와 상품 재고의 원천은 각각 Keycloak과 Payment Service에 존재합니다.
              Ecommerce는 원천 데이터를 직접 관리하지 않으며,
              자체적으로 필요한 정보만 확장하여 Bounded Context를 구성합니다.
            </DocParagraph>
          </DocCard>
        </DocBlock>

      </div>
    ),
  },
  {
    key: 'flow',
    label: '카프카 토폴로지',
    content: <ServiceFlowSection data={ecommerceFlow} />,
    doc: true,
  },
  {
    key: 'context',
    label: '바운디드 컨텍스트',
    content: <BoundedContextSection data={ecommerceContext} />,
    doc: true,
  },
];

export function EcommerceTab() {
  return (
    <ServiceDocLayout
      title="이커머스"
      sections={sections}
    />
  );
}
