import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout, DocLink } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';
import { ServiceFlowSection } from './ServiceFlowSection';
import type { ServiceFlowData } from './ServiceFlowSection';
import { BoundedContextSection } from './BoundedContextSection';
import type { BoundedContextData } from './BoundedContextSection';

const paymentFlow: ServiceFlowData = {
  publishTopic: 'payment-events',
  publishes: [
    { name: 'OrderStockReservedEvent', desc: '재고·포인트 선차감 완료, 결제 진행 허용' },
    { name: 'OrderStockValidationFailedEvent', desc: '재고 또는 포인트 부족으로 주문 거부' },
    { name: 'PaymentConfirmedEvent', desc: '결제 확정 기록' },
    { name: 'PaymentProcessFailedEvent', desc: '결제 실패, 선차감분 자동 복구' },
    { name: 'PaymentCancelConfirmedEvent', desc: '결제 취소 확정, 재고·포인트 자동 복구' },
    { name: 'ProductStockSynchronizedEvent', desc: '현재 재고 절대값 동기화' },
    { name: 'AccountBalanceSynchronizedEvent', desc: '현재 잔액 절대값 동기화' },
  ],
  consumes: [
    {
      topic: 'ecommerce-events',
      events: [
        { name: 'OrderCreatedEvent', action: '재고 검증 및 선차감 처리' },
        { name: 'ProductCreatedEvent', action: '상품 및 초기 재고 등록' },
        { name: 'StockAdjustmentRequestedEvent', action: '재고 입고·차감 반영' },
      ],
    },
    {
      topic: 'cash-gateway-events',
      events: [
        { name: 'PaymentApprovedEvent', action: '결제 승인 기록 생성' },
        { name: 'PaymentFailedEvent', action: '선차감 재고·포인트 복구' },
        { name: 'PaymentCancelledEvent', action: '결제 취소 기록 및 재고 복구' },
      ],
    },
    {
      topic: 'progression-events',
      events: [
        { name: 'ArchiveClaimedEvent', action: '아카이브 보상 포인트 지급' },
        { name: 'QuotaClaimedEvent', action: '반복 보상 포인트 지급' },
        { name: 'SeasonPromotionRewardClaimedEvent', action: '시즌 프로모션 보상 포인트 지급' },
      ],
    },
  ],
};

const paymentContext: BoundedContextData = {
  contexts: [
    {
      name: 'Payment',
      service: 'payment',
      detail: '결제 확정 기록의 진실의 원천. 불변이며 승인·취소만 존재한다. 실패는 기록하지 않는다.',
      externals: [
        { service: 'cashgw', desc: 'PaymentProcess 이벤트 발행. Payment 생성 트리거' },
        { service: 'ecommerce', desc: 'Payment 이벤트 소비. Order 상태 전이' },
      ],
    },
    {
      name: 'Product',
      service: 'payment',
      detail: '상품 재고의 진실의 원천. 모든 재고 변동을 변화량으로 기록하며, 언제든 재집계로 정합성을 검증할 수 있다.',
      externals: [
        { service: 'ecommerce', desc: '읽기 전용 캐시. 이벤트로 동기화 받을 뿐, 재고를 직접 변경하지 않는다' },
      ],
      children: [
        {
          name: 'ProductRecord',
          service: 'payment',
          detail: '재고 변동 이력. 불변으로 변화량을 쌓으며, 합산으로 현재 재고 수량을 산출한다.',
        },
      ],
    },
    {
      name: 'Account',
      service: 'payment',
      detail: '유저 잔액의 진실의 원천. 포인트 지급·차감·환불 모두 변화량 기반으로 관리한다.',
      externals: [
        { service: 'ecommerce', desc: '읽기 전용 캐시. 잔액 표시용으로 이벤트 동기화만 받는다' },
        { service: 'progression', desc: '보상 이벤트 발행자. 포인트/쿠폰 지급 요청을 보내는 쪽' },
      ],
      children: [
        {
          name: 'AccountRecord',
          service: 'payment',
          detail: '잔액 변동 이력. 불변으로 변화량을 쌓으며, 합산으로 현재 잔액을 산출한다.',
        },
      ],
    },
    {
      name: 'OrderSnapshot',
      service: 'payment',
      detail: '주문 시점의 상품·수량·가격 스냅샷. 결제 취소 시 이 스냅샷 기준으로 재고를 원복한다.',
      externals: [
        { service: 'ecommerce', desc: '주문 원본을 소유. 주문 생성 이벤트에 담긴 정보로 스냅샷을 생성한다', isSourceOfTruth: true },
      ],
    },
  ],
};

/* ── 역할 분담 플로우 데이터 ── */

const ROLE_NODES: MiniFlowNode[] = [
  { id: 'role-cgw', label: 'Cash Gateway\n(PG 비즈니스 규칙)', x: 0, y: 0,
    style: { bg: '#92400e', color: '#fef3c7', border: '1px solid #d97706', width: 200 }, sourcePosition: 'bottom' },
  { id: 'role-payment', label: 'Payment Service\n(자원 관리)', x: 240, y: 100,
    style: { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', width: 200 }, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'role-ecommerce', label: 'Ecommerce\n(최종 일관성)', x: 480, y: 200,
    style: { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6', width: 200 }, targetPosition: 'top' },
];

const ROLE_EDGES: MiniFlowEdge[] = [
  { source: 'role-cgw', target: 'role-payment', label: '리액티브', animated: true },
  { source: 'role-payment', target: 'role-ecommerce', label: '리액티브', animated: true },
];

/* ── 여담: @TransactionalEventListener → @EventListener 토폴로지 ── */

const elPhaseStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 160 };
const elLockDanger = { bg: '#450a0a', color: '#fca5a5', border: '2px solid #dc2626', width: 180 };
const elLockOk = { bg: '#14532d', color: '#86efac', border: '2px solid #22c55e', width: 180 };
const elCommitBox = { bg: '#1e1b4b', color: '#a5b4fc', border: '2px dashed #6366f1', width: 80 };
const elLabelBox = { bg: '#111827', color: '#9ca3af', border: '1px solid #374151', width: 200, fontWeight: 'bold' };

// 토폴로지 A: BEFORE_COMMIT — flush 후 교차 락 → 데드락
const BC_R1 = 0;
const BC_R2 = 90;

const BEFORE_COMMIT_NODES: MiniFlowNode[] = [
  { id: 'bc-la', label: 'TX-A', x: 0, y: BC_R1, style: elLabelBox },
  { id: 'bc-a-domain', label: '도메인 변경', x: 220, y: BC_R1,
    style: elPhaseStyle, sourcePosition: 'right' },
  { id: 'bc-a-flush', label: 'flush 완료\n(row X 점유)', x: 410, y: BC_R1,
    style: elPhaseStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'bc-a-lock', label: 'BEFORE_COMMIT\nrow Y 락 대기', x: 620, y: BC_R1,
    style: elLockDanger, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'bc-dead', label: 'DEADLOCK', x: 850, y: BC_R1 + 45,
    style: { bg: '#450a0a', color: '#fca5a5', border: '2px solid #dc2626', width: 110, fontWeight: 'bold' }, targetPosition: 'left' },

  { id: 'bc-lb', label: 'TX-B', x: 0, y: BC_R2, style: elLabelBox },
  { id: 'bc-b-domain', label: '도메인 변경', x: 220, y: BC_R2,
    style: elPhaseStyle, sourcePosition: 'right' },
  { id: 'bc-b-flush', label: 'flush 완료\n(row Y 점유)', x: 410, y: BC_R2,
    style: elPhaseStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'bc-b-lock', label: 'BEFORE_COMMIT\nrow X 락 대기', x: 620, y: BC_R2,
    style: elLockDanger, targetPosition: 'left', sourcePosition: 'right' },
];

const BEFORE_COMMIT_EDGES: MiniFlowEdge[] = [
  { source: 'bc-a-domain', target: 'bc-a-flush', color: '#475569' },
  { source: 'bc-a-flush', target: 'bc-a-lock', color: '#dc2626', dashed: true },
  { source: 'bc-a-lock', target: 'bc-dead', color: '#dc2626' },
  { source: 'bc-b-domain', target: 'bc-b-flush', color: '#475569' },
  { source: 'bc-b-flush', target: 'bc-b-lock', color: '#dc2626', dashed: true },
  { source: 'bc-b-lock', target: 'bc-dead', color: '#dc2626' },
];

// 토폴로지 B: @EventListener — 즉시 락 선점 → 순차 처리
const EV_R1 = 0;
const EV_R2 = 90;

const EVENT_LISTENER_NODES: MiniFlowNode[] = [
  { id: 'ev-la', label: 'TX-A', x: 0, y: EV_R1, style: elLabelBox },
  { id: 'ev-a-domain', label: '도메인 변경', x: 220, y: EV_R1,
    style: elPhaseStyle, sourcePosition: 'right' },
  { id: 'ev-a-lock', label: '@EventListener\n락 획득 (선점)', x: 410, y: EV_R1,
    style: elLockOk, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ev-a-flush', label: 'flush', x: 620, y: EV_R1,
    style: elPhaseStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ev-a-commit', label: 'COMMIT', x: 770, y: EV_R1,
    style: elCommitBox, targetPosition: 'left' },

  { id: 'ev-lb', label: 'TX-B', x: 0, y: EV_R2, style: elLabelBox },
  { id: 'ev-b-domain', label: '도메인 변경', x: 220, y: EV_R2,
    style: elPhaseStyle, sourcePosition: 'right' },
  { id: 'ev-b-wait', label: '락 대기\n(TX-A 완료 후 획득)', x: 410, y: EV_R2,
    style: { bg: '#1e293b', color: '#fbbf24', border: '1px solid #d97706', width: 180 }, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ev-b-flush', label: 'flush', x: 620, y: EV_R2,
    style: elPhaseStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ev-b-commit', label: 'COMMIT', x: 770, y: EV_R2,
    style: elCommitBox, targetPosition: 'left' },
];

const EVENT_LISTENER_EDGES: MiniFlowEdge[] = [
  { source: 'ev-a-domain', target: 'ev-a-lock', label: '즉시', color: '#22c55e' },
  { source: 'ev-a-lock', target: 'ev-a-flush', color: '#475569' },
  { source: 'ev-a-flush', target: 'ev-a-commit', color: '#6366f1', dashed: true },
  { source: 'ev-b-domain', target: 'ev-b-wait', label: '대기', color: '#d97706' },
  { source: 'ev-b-wait', target: 'ev-b-flush', color: '#475569' },
  { source: 'ev-b-flush', target: 'ev-b-commit', color: '#6366f1', dashed: true },
];

/* ── 선차감 흐름 플로우 데이터 ── */

const ecStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6' };
const pmStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' };
const cgStyle = { bg: '#92400e', color: '#fef3c7', border: '1px solid #d97706' };
const okStyle = { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e' };
const failStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' };

const PREDEDUCT_NODES: MiniFlowNode[] = [
  // Step 1: Ecommerce
  { id: 'pd-order', label: 'Ecommerce\n주문 접수 (CREATED)', x: 0, y: 0, style: ecStyle, sourcePosition: 'bottom' },
  // Step 2: Payment 검증
  { id: 'pd-check', label: 'Payment\n재고 검증 + 선차감', x: 0, y: 100, style: pmStyle, targetPosition: 'top', sourcePosition: 'right' },
  { id: 'pd-lack', label: '부족\n주문 실패', x: 250, y: 100, style: failStyle, targetPosition: 'left' },
  { id: 'pd-reserved', label: '충분\nPG 결제 진행', x: 0, y: 200, style: okStyle, targetPosition: 'top', sourcePosition: 'bottom' },
  // Step 3: Cash Gateway → PG
  { id: 'pd-pg', label: 'Cash Gateway\nPG 결제', x: 0, y: 300, style: cgStyle, targetPosition: 'top', sourcePosition: 'right' },
  { id: 'pd-success', label: '성공\n재고 유지, 정산 기록', x: 250, y: 260, style: okStyle, targetPosition: 'left' },
  { id: 'pd-fail', label: '실패\n선차감분 자동 복원', x: 250, y: 340, style: failStyle, targetPosition: 'left' },
];

const PREDEDUCT_EDGES: MiniFlowEdge[] = [
  { source: 'pd-order', target: 'pd-check', label: 'OrderCreatedEvent', animated: true },
  { source: 'pd-check', target: 'pd-lack', label: '부족', color: '#dc2626' },
  { source: 'pd-check', target: 'pd-reserved', label: '충분', color: '#22c55e', animated: true },
  { source: 'pd-reserved', target: 'pd-pg', label: 'OrderStockReservedEvent', animated: true },
  { source: 'pd-pg', target: 'pd-success', label: '승인', color: '#22c55e', animated: true },
  { source: 'pd-pg', target: 'pd-fail', label: '실패', color: '#dc2626' },
];

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '서비스 의도' },
      { key: 'svc-desc', label: '서비스 설명' },
      { key: 'svc-design', label: '핵심 설계 및 코드' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        {/* 서비스 의도 */}
        <DocBlock id="svc-intent" title="서비스 의도">
          <DocParagraph>
            자원을 관리할 때 최종 원천이 서비스 내부가 아니라 외부 PG사에 의거하는 경우,
            아이러니하게도 그 상태를 얼마나 신뢰해야 하는가에 대한 고민이 있었습니다.
            서비스 안에서 거래를 시행하고 취소하면 추적에 문제가 없지만,
            현실에서는 사용자가 PG사에 직접 결제 취소를 하기도 하고,
            PG사의 노티 오류나 늦은 통보로 상태가 뒤늦게 바뀌기도 합니다.
            즉, 도메인의 처리 케이스가 외부 원천에 의해 언제든 변화할 수 있는 구조입니다.
          </DocParagraph>
          <DocParagraph>
            이 상황에서 마지막 상태를 기록하여 머지하거나 수정하는 방식은
            추적성과 레이스 컨디션에 다소 노출되어 있다고 생각했습니다.
          </DocParagraph>
          <DocParagraph>
            여기서 도달한 판단은, 자원이란 언제든 재집계가 가능해야 한다는 것이었습니다.
            모든 변동을 불변으로 기록하고, 현재 상태는 기록된 행위 자체의 합산으로 신뢰합니다.
            외부 원천에 의해 상태가 뒤늦게 바뀌더라도 이력은 유실되지 않고,
            추적과 재집계가 보장된다고 판단했습니다.
            이것이 이벤트 소싱을 설계의 중심에 둔 이유입니다.
          </DocParagraph>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            Payment Service는 외부 거래의 비즈니스 케이스에서 한 발자국 물러난 서비스입니다.
            Cash Gateway의 정제된 데이터만 소비하므로
            PG 프로토콜의 복잡성이 이 서비스까지 전파되지 않습니다.
            Cash Gateway의 이벤트에 반응하여 금액과 자원을 기록하고 재집계합니다.
          </DocParagraph>
          <DocCard title="역할 분담">
            <DocMiniFlow
              nodes={ROLE_NODES}
              edges={ROLE_EDGES}
              ownerService="Payment"
            />
          </DocCard>

          <DocCard title="Product : 왜 Ecommerce가 아닌 Payment에 두었는가">
            <DocParagraph>
              거래의 승인·취소에 따라 재고(Product.stock)도 원자 단위로 처리되어야 합니다.
              재고(Product.stock)를 Ecommerce에 두면 주문과 재고 차감이 서로 다른 서비스에서 일어나게 되고,
              사가 오케스트레이션 패턴 없이는 정합성을 보장할 수 없다고 판단했습니다.
              이 복잡성을 도입하지 않는 것이 의도였습니다.
            </DocParagraph>
            <DocParagraph>
              재고의 진실의 원천을 Payment Service에 두면
              재고 차감, 결제 확정, 포인트 정산이 하나의 서비스 안에서 원자적으로 처리됩니다.
              Ecommerce의 재고는 읽기 전용 캐시로만 동작하며,
              실제 재고 판단은 Payment Service가 담당합니다.
            </DocParagraph>
          </DocCard>

          <DocCard title="선차감 전략 : 왜 선차감인가">
            <DocParagraph>
              외부 PG 응답에 의거하여 재고를 처리하면
              트랜잭션 라이프사이클이 길어지고, 외부 PG의 장애에 의존하게 된다고 생각했습니다.
              또한 외부 응답에 의거한 재고 변화는 동시성 환경에서 초과 판매에 자유롭지 못하다고 판단했습니다.
            </DocParagraph>
            <DocParagraph>
              이를 해결하는 방법으로 순서 보증 큐 처리와 선차감 전략이 존재하는데,
              선차감 전략을 선택했습니다.
              주문을 일단 받고(CREATED), Payment Service가 재고를 먼저 차감합니다.
              재고가 부족하다고 판단되면 PG 요청 자체를 하지 않고,
              PG 응답에 의거하여 성공하면 선차감분을 유지하고, 실패하면 자동으로 복원합니다.
            </DocParagraph>
            <DocMiniFlow
              nodes={PREDEDUCT_NODES}
              edges={PREDEDUCT_EDGES}
              ownerService="Payment"
            />
            <DocCallout>
              Ecommerce의 Product.stock은 신뢰하지 않는 값입니다.
              동시 주문 시 Ecommerce의 캐시만으로는 초과 판매를 막을 수 없습니다.
              실제 재고 검증은 Payment가 비관 락 + 재집계로 수행합니다.
            </DocCallout>
          </DocCard>

          <DocCard title="이벤트 소싱 : 변화량 기반 이력 관리">
            <DocParagraph>
              재고와 잔액은 현재 값을 직접 덮어쓰지 않습니다.
              모든 변동 행위를 기록하고, 재집계를 통해 현재 상태를 산출합니다.
            </DocParagraph>
            <DocCode>{`ProductRecord (재고 변동 이력, append-only)
  INSERT (product_id=1, stock=+100, reason='초기 재고')
  INSERT (product_id=1, stock=-5,   reason='[주문 차감] order=abc')
  INSERT (product_id=1, stock=+5,   reason='[결제 실패 복원] order=abc')

  Product.stock = SUM(ProductRecord.stock) = 100

AccountRecord (잔액 변동 이력, 동일 패턴)
  INSERT (account_id=1, amount=+1000, reason='포인트 지급')
  INSERT (account_id=1, amount=-500,  reason='주문 포인트 사용')

  Account.balance = SUM(AccountRecord.amount) = 500`}</DocCode>
          </DocCard>
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          <DocCard title="@EventListener 핸들러 : 동기 처리 (같은 트랜잭션)">
            <DocParagraph>
              Product 도메인은 재고(stock) 변경 및 flush 시 InternalStockChangedEvent를 발행합니다.
              핸들러가 이 이벤트를 수신하여 변동 이력(Record)을 쌓습니다.
            </DocParagraph>
            <DocCode language="kotlin">{`@Component
class ProductEventHandler(
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>
) {
    @EventListener
    fun handle(event: InternalProductStockChangedEvent) {
        val product = event.product

        // 1. ProductRecord 생성 (변화량 delta만 저장)
        val record = ProductRecord(
            productId = product.id!!,
            stock = event.stockDelta,   // delta값 저장
            reason = event.reason
        )
        productRecordRepository.save(record)

        // 2. 재집계 (isRecord=true인 경우)
        if (event.isRecord) {
            recordRepository.writeRecord(product.id!!)
        }
    }
}`}</DocCode>
            <DocCallout>
              @TransactionalEventListener(AFTER_COMMIT)를 쓰지 않는 이유는
              Record 생성이 Product 변경과 같은 트랜잭션에서 일어나길 의도하였기 때문입니다.
            </DocCallout>
          </DocCard>

          <DocCard title="RecordRepository : 재집계 인터페이스와 구현">
            <DocParagraph>
              RecordRepository는 이벤트 소싱 재집계를 위한 공통 인터페이스입니다.
              ProductRepository와 AccountRepository가 이를 구현하여
              각각의 Record를 기반으로 재집계합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// 재집계 공통 인터페이스
interface RecordRepository<T> {
    fun readRecord(id: Long): T    // 읽기 전용 재집계
    fun writeRecord(id: Long): T   // 비관 락 + 재집계 + DB 반영
}

// ProductRepository가 RecordRepository<Product>를 구현
class ProductRepository : RecordRepository<Product> {
    override fun writeRecord(id: Long): Product { ... }
}

// AccountRepository가 RecordRepository<Account>를 구현
class AccountRepository : RecordRepository<Account> {
    override fun writeRecord(id: Long): Account { ... }
}`}</DocCode>
          </DocCard>

          <DocCard title="전체 흐름 — updateStockByDelta → Record → 재집계">
            <DocCode>{`전체 처리 흐름 (하나의 트랜잭션)

1. product.updateStockByDelta(-5, "주문 차감")
   ├─ registerEvent(InternalProductStockChangedEvent)
   └─ registerEvent(ProductStockSynchronizedEvent)

2. productRepository.saveAndPublish(product)
   ├─ JPA save() → DB 반영
   └─ pullDomainEvents() → 이벤트 발행

3. ProductEventHandler.handle() — @EventListener 동기 실행
   ├─ ProductRecord 생성 (stock=-5, reason="주문 차감")
   └─ recordRepository.writeRecord(productId)
      ├─ findByIdForUpdate() → 비관 락
      ├─ SUM(ProductRecord.stock) → 재집계
      └─ dirty checking → Product.stock 갱신

4. DomainEventPublisher — @TransactionalEventListener(BEFORE_COMMIT)
   └─ ProductStockSynchronizedEvent → OutboxEvent 저장

5. 트랜잭션 커밋
   → Product.stock 확정, ProductRecord 확정, OutboxEvent 확정
   → 하나라도 실패하면 전체 롤백

6. OutboxEventProcessor (별도 스케줄러)
   → OutboxEvent → Kafka 발행 → Ecommerce 캐시 동기화`}</DocCode>
          </DocCard>


        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <DocParagraph>
            Payment Service의 설계는 이전에 개인적으로 진행했던 결제 시스템 프로젝트에서 출발했습니다.
            햄스터 월드의 각 서비스들의 바운디드 컨텍스트로 확장해보았습니다.
          </DocParagraph>
          <DocLink
            href="https://github.com/gtypeid/payment-system"
            label="payment-system"
            desc="이 프로젝트의 시작점이 되는 결제 시스템 레포지토리"
          />

          <DocCard title="@TransactionalEventListener → @EventListener">
            <DocParagraph>
              Record 생성을 @TransactionalEventListener(BEFORE_COMMIT)로 처리했던 시기가 있었습니다.
              트랜잭션 라이프사이클에 엮어 커밋 직전에 이력을 쌓는 구조였으나,
              BEFORE_COMMIT 시점은 이미 flush가 완료된 뒤이므로 비관 락(findByIdForUpdate) 획득이 트랜잭션 후반부로 밀립니다.
              동시 트랜잭션이 각자 flush를 마치고 BEFORE_COMMIT에서 서로의 락을 기다리는 교착 상태(데드락)에 더 취약해졌고,
              이에 따라 @EventListener로 전환하여 락 획득을 트랜잭션 초기로 앞당겼습니다.
            </DocParagraph>
            <DocMiniFlow
              nodes={BEFORE_COMMIT_NODES}
              edges={BEFORE_COMMIT_EDGES}
              direction="LR"
              height={180}
            />
            <DocMiniFlow
              nodes={EVENT_LISTENER_NODES}
              edges={EVENT_LISTENER_EDGES}
              direction="LR"
              height={180}
            />
            <DocCallout>
              BEFORE_COMMIT은 flush 이후에 실행되므로, 동시 트랜잭션이 각자 flush를 마친 뒤
              서로의 비관 락을 기다리는 교착 상태에 빠질 수 있습니다.
              @EventListener는 flush 이전에 락을 선점하므로 경합 구간이 짧아집니다.
            </DocCallout>
          </DocCard>
        </DocBlock>

      </div>
    ),
  },
  {
    key: 'flow',
    label: '카프카 토폴로지',
    content: <ServiceFlowSection data={paymentFlow} />,
    doc: true,
  },
  {
    key: 'context',
    label: '바운디드 컨텍스트',
    content: <BoundedContextSection data={paymentContext} />,
    doc: true,
  },
];

export function PaymentTab() {
  return (
    <ServiceDocLayout
      title="페이먼트"
      sections={sections}
    />
  );
}
