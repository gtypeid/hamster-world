import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocLink, DocCallout } from './ServiceDocLayout';
import { DocMiniFlow } from './DocMiniFlow';
import type { MiniFlowNode, MiniFlowEdge } from './DocMiniFlow';
import type { DocSection } from './ServiceDocLayout';
import { ServiceFlowSection } from './ServiceFlowSection';
import type { ServiceFlowData } from './ServiceFlowSection';
import { BoundedContextSection } from './BoundedContextSection';
import type { BoundedContextData } from './BoundedContextSection';

const cashGatewayFlow: ServiceFlowData = {
  publishTopic: 'cash-gateway-events',
  publishes: [
    { name: 'PaymentApprovedEvent', desc: 'PG 결제 승인 완료 알림' },
    { name: 'PaymentFailedEvent', desc: 'PG 결제 실패 알림' },
    { name: 'PaymentCancelledEvent', desc: 'PG 결제 취소 완료 알림' },
  ],
  consumes: [
    {
      topic: 'payment-events',
      events: [
        { name: 'OrderStockReservedEvent', action: '재고 확보 확인 후 PG 결제 요청 실행' },
      ],
    },
  ],
};

const cashGatewayContext: BoundedContextData = {
  contexts: [
    {
      name: 'PaymentProcess',
      service: 'cashgw',
      detail: 'PG 결제 통신의 진실의 원천. CAS 기반 상태 머신으로 승인·실패·취소를 이벤트로 발행한다.',
      externals: [
        { service: 'payment', desc: '결제 트리거(OrderStockReservedEvent) 및 확정 기록(Payment) 생성' },
        { service: 'ecommerce', desc: 'Order 상태 전이' },
      ],
    },
    {
      name: 'CashGatewayMid',
      service: 'cashgw',
      detail: '가맹점 식별자 매핑. 사용자와 PG 제공자 조합으로 자동 생성되며, PG 가맹점 번호와의 중개 역할을 한다.',
      externals: [
        { service: 'ecommerce', desc: '가맹점 등록 시 발급받은 식별자를 저장하는 쪽' },
      ],
    },
  ],
};

/* ── 결제 경로 미니 플로우 데이터 ── */

const pgStyle = { bg: '#831843', color: '#fbbf24', border: '1px solid #be185d' };
const cgwStyle = { bg: '#92400e', color: '#fef3c7', border: '1px solid #d97706' };
const kafkaStyle = { bg: '#0c4a6e', color: '#7dd3fc', border: '1px solid #0284c7' };
const paymentStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' };
const webhookStyle = { bg: '#4a044e', color: '#f0abfc', border: '1px solid #a855f7' };

const ecommerceStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6' };

// Line 1: Ecommerce → Kafka → (down to line 2 Cash Gateway)
// Line 2: Cash Gateway → PG → Webhook → (down to line 3 Cash Gateway)
// Line 3: Cash Gateway → Kafka → Payment Service
const otherStyle = { bg: '#1e293b', color: '#94a3b8', border: '1px solid #475569', width: 180 };

const FLOW_NODES: MiniFlowNode[] = [
  // Line 1
  { id: 'ecommerce', label: 'Ecommerce', x: 0, y: 0, style: ecommerceStyle },
  { id: 'kafka1', label: 'Kafka', x: 200, y: 0, style: kafkaStyle, sourcePosition: 'bottom' },
  // Line 1-sub
  { id: 'other', label: 'Other Service', x: 0, y: 100, style: otherStyle, sourcePosition: 'bottom' },
  // Line 2
  { id: 'cgw1', label: 'Cash Gateway', x: 200, y: 200, style: cgwStyle, targetPosition: 'top' },
  { id: 'pg', label: 'PG', x: 400, y: 200, style: pgStyle },
  { id: 'webhook', label: 'Webhook', x: 600, y: 200, style: webhookStyle, sourcePosition: 'bottom' },
  // Line 3
  { id: 'cgw2', label: 'Cash Gateway', x: 600, y: 300, style: cgwStyle, targetPosition: 'top' },
  { id: 'kafka2', label: 'Kafka', x: 800, y: 300, style: kafkaStyle },
  { id: 'payment', label: 'Payment Service', x: 1000, y: 300, style: paymentStyle },
];

const FLOW_EDGES: MiniFlowEdge[] = [
  // Line 1
  { source: 'ecommerce', target: 'kafka1', animated: true },
  // Line 1 → Line 2 (vertical)
  { source: 'kafka1', target: 'cgw1', animated: true },
  // Other Service → Cash Gateway (HTTP 직접 통신)
  { source: 'other', target: 'cgw1', animated: true, label: 'HTTP 요청' },
  // Line 2
  { source: 'cgw1', target: 'pg', animated: true },
  { source: 'pg', target: 'webhook', animated: true },
  // Line 2 → Line 3 (vertical)
  { source: 'webhook', target: 'cgw2', animated: true },
  // Line 3
  { source: 'cgw2', target: 'kafka2', animated: true },
  { source: 'kafka2', target: 'payment', animated: true },
];

/* ── MID 구조 미니 플로우 데이터 ── */

const merchantStyle = { bg: '#1e293b', color: '#94a3b8', border: '1px solid #475569' };
const orderStyle = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6', width: 180 };

const MID_NODES: MiniFlowNode[] = [
  // User Order (far left)
  { id: 'user-order', label: 'User Order\n(총액 결제)', x: 0, y: 80, style: orderStyle, sourcePosition: 'right' },
  // Merchant OrderItems (split)
  { id: 'item-a', label: 'OrderItem\nMerchant A', x: 240, y: 0, style: merchantStyle, targetPosition: 'left' },
  { id: 'item-b', label: 'OrderItem\nMerchant B', x: 240, y: 80, style: merchantStyle, targetPosition: 'left' },
  { id: 'item-c', label: 'OrderItem\nMerchant C', x: 240, y: 160, style: merchantStyle, targetPosition: 'left' },
  // CGW MIDs
  { id: 'cgw-mid-a', label: 'CGW_MID_A', x: 460, y: 0, style: cgwStyle },
  { id: 'cgw-mid-b', label: 'CGW_MID_B', x: 460, y: 80, style: cgwStyle },
  { id: 'cgw-mid-c', label: 'CGW_MID_C', x: 460, y: 160, style: cgwStyle },
  // PG MID (single approval)
  { id: 'pg-mid', label: 'PG_MID_0\n(승인 1건, 총액)', x: 680, y: 80, style: pgStyle },
  // Payment Service (settlement)
  { id: 'mid-payment', label: 'Payment Service\n(Merchant별 분배)', x: 900, y: 80, style: paymentStyle },
];

const MID_EDGES: MiniFlowEdge[] = [
  // Order → OrderItems (fan-out)
  { source: 'user-order', target: 'item-a' },
  { source: 'user-order', target: 'item-b' },
  { source: 'user-order', target: 'item-c' },
  // OrderItems → CGW MIDs (식별)
  { source: 'item-a', target: 'cgw-mid-a' },
  { source: 'item-b', target: 'cgw-mid-b' },
  { source: 'item-c', target: 'cgw-mid-c' },
  // CGW MIDs → PG MID (N:1 합류)
  { source: 'cgw-mid-a', target: 'pg-mid' },
  { source: 'cgw-mid-b', target: 'pg-mid' },
  { source: 'cgw-mid-c', target: 'pg-mid' },
  // PG → Payment (정산)
  { source: 'pg-mid', target: 'mid-payment', animated: true },
];

/* ── PaymentProcess 상태 전이 플로우 데이터 ── */

const stUnknown = { bg: '#1e293b', color: '#94a3b8', border: '1px solid #475569' };
const stPending = { bg: '#92400e', color: '#fef3c7', border: '1px solid #d97706' };
const stSuccess = { bg: '#14532d', color: '#86efac', border: '1px solid #22c55e' };
const stFailed = { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' };
const stCancelled = { bg: '#4a044e', color: '#f0abfc', border: '1px solid #a855f7' };

const stRequest = { bg: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6' };
const stBoundary = { bg: '#0f172a', color: '#475569', border: '1px dashed #334155', width: 120 };

const STATE_NODES: MiniFlowNode[] = [
  // 상단 메인 라인
  { id: 'st-request', label: '외부 HTTP 요청', x: 0, y: 0, style: stRequest },
  { id: 'st-unknown', label: 'UNKNOWN\n(DB 적재 + ACK)', x: 200, y: 0, style: stUnknown },
  { id: 'st-bound1', label: '트랜잭션 경계', x: 410, y: 0, type: 'default', style: stBoundary },
  { id: 'st-pending', label: 'PENDING\n(폴링 픽업)', x: 570, y: 0, style: stPending },
  { id: 'st-pg', label: '외부 PG\nHTTP + ACK', x: 770, y: 0, style: pgStyle, sourcePosition: 'bottom' },
  { id: 'st-bound2', label: '트랜잭션 경계', x: 970, y: 0, type: 'default', style: stBoundary, sourcePosition: 'bottom' },
  // Webhook 분기
  { id: 'st-webhook', label: 'Webhook\n응답 수신', x: 970, y: 110, style: webhookStyle, targetPosition: 'top', sourcePosition: 'left' },
  { id: 'st-success', label: 'SUCCESS', x: 770, y: 210, style: stSuccess, targetPosition: 'top', sourcePosition: 'bottom' },
  { id: 'st-failed', label: 'FAILED', x: 1170, y: 210, style: stFailed, targetPosition: 'top' },
  // 취소
  { id: 'st-cancelled', label: 'CANCELLED', x: 770, y: 310, style: stCancelled, targetPosition: 'top' },
];

const STATE_EDGES: MiniFlowEdge[] = [
  // 메인 라인
  { source: 'st-request', target: 'st-unknown', animated: true },
  { source: 'st-unknown', target: 'st-bound1', dashed: true, color: '#334155' },
  { source: 'st-bound1', target: 'st-pending', dashed: true, color: '#334155' },
  { source: 'st-pending', target: 'st-pg', label: 'PG 전송', animated: true },
  { source: 'st-pg', target: 'st-bound2', dashed: true, color: '#334155' },
  // Webhook 분기
  { source: 'st-bound2', target: 'st-webhook', dashed: true, color: '#334155' },
  { source: 'st-webhook', target: 'st-success', label: '승인', color: '#22c55e', animated: true },
  { source: 'st-webhook', target: 'st-failed', label: '실패', color: '#dc2626' },
  // 취소
  { source: 'st-success', target: 'st-cancelled', label: '취소 요청', color: '#a855f7' },
];

/* ── 여담: 엔티티 소유권 변천 토폴로지 ── */

// Before: 모놀리식 — PaymentAttempt + Payment 모두 원형 서비스에 존재
const monoStyle = { bg: '#92400e', color: '#fef3c7', border: '2px solid #d97706', width: 270 };
const monoEntityStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 180 };

const BEFORE_ENTITY_NODES: MiniFlowNode[] = [
  { id: 'be-cgw', label: 'payment-system\n(원형 서비스, 모놀리식)', x: 0, y: 40,
    style: monoStyle, sourcePosition: 'right' },
  { id: 'be-attempt', label: 'PaymentAttempt\nREQUIRES_NEW (이력)', x: 340, y: 0,
    style: monoEntityStyle, targetPosition: 'left' },
  { id: 'be-payment', label: 'Payment\n불변 확정 기록', x: 340, y: 80,
    style: monoEntityStyle, targetPosition: 'left' },
];
const BEFORE_ENTITY_EDGES: MiniFlowEdge[] = [
  { source: 'be-cgw', target: 'be-attempt', color: '#d97706', label: '소유' },
  { source: 'be-cgw', target: 'be-payment', color: '#d97706', label: '소유' },
];

// After: EDA — PaymentProcess는 Cash Gateway, Payment는 Payment Service로 분리
const cgwBoxStyle = { bg: '#92400e', color: '#fef3c7', border: '2px solid #d97706', width: 200 };
const payBoxStyle = { bg: '#7f1d1d', color: '#fca5a5', border: '2px solid #dc2626', width: 200 };
const entityStyle = { bg: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', width: 170 };

const AFTER_ENTITY_NODES: MiniFlowNode[] = [
  { id: 'ae-cgw', label: 'Cash Gateway', x: 0, y: 40,
    style: cgwBoxStyle, sourcePosition: 'right' },
  { id: 'ae-process', label: 'PaymentProcess\nMANDATORY (상태 머신)', x: 250, y: 40,
    style: entityStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ae-pay-svc', label: 'Payment Service', x: 520, y: 40,
    style: payBoxStyle, targetPosition: 'left', sourcePosition: 'right' },
  { id: 'ae-payment', label: 'Payment\n불변 확정 기록', x: 770, y: 40,
    style: entityStyle, targetPosition: 'left' },
];
const AFTER_ENTITY_EDGES: MiniFlowEdge[] = [
  { source: 'ae-cgw', target: 'ae-process', color: '#d97706', label: '소유' },
  { source: 'ae-process', target: 'ae-pay-svc', color: '#dc2626', animated: true, label: '이벤트' },
  { source: 'ae-pay-svc', target: 'ae-payment', color: '#dc2626', label: '소유' },
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
            이전 회사에서 결제·정산 대행 서비스를 운영하며 개발 유지보수를 담당했습니다.
            운영 중 가장 큰 문제는 복잡성이었습니다.
          </DocParagraph>
          <DocParagraph>
            어떤 거래는 서비스가 직접 PG에 요청하고, 어떤 거래는 외부에서 이미 승인된 건을 가져오고,
            또 어떤 거래는 파트너사의 외부 전산을 연동해야 했습니다.
            모든 진입점과 처리 흐름이 한 곳에 혼재되면서,
            개발자와 CS팀 모두 거래별로 무엇이 가능하고 무엇이 불가능한지 파악하기 어려워졌습니다.
          </DocParagraph>
          <DocParagraph>
            이 경험에서 판단한 것은, 내부 결제 코어 앞에 정재된 단일 진입점을 두면 어떨까 생각하였습니다.
            햄스터 월드의 Cash Gateway는 이 판단을 반영한 설계입니다.
            다수의 요청을 하나의 방화벽에서 정재하고,
            Payment Service는 그 뒤에서 이벤트만 소비하는 프라이빗 코어로 동작합니다.
          </DocParagraph>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            햄스터 월드에서 돈 혹은 자원에 대한 진실의 원천은 Payment Service가 담당합니다.
            Cash Gateway는 그 앞단의 <span className="text-amber-400 font-semibold">결제 방화벽</span>입니다.
            외부 PG사에 대한 결제 승인·실패 및 연동을 Cash Gateway에서 처리하고,
            원천 PG의 노티(Webhook) 기반으로 상태를 전파하면 Payment Service가 이를 리액티브하게 소비합니다.
          </DocParagraph>
          <DocCard title="결제 경로">
            <DocParagraph>
              Cash Gateway가 PG와 직접 HTTP 통신합니다. 폴링 기반 요청 + Webhook 수신.
            </DocParagraph>
            <DocMiniFlow
              nodes={FLOW_NODES}
              edges={FLOW_EDGES}
              ownerService="Cash Gateway"
            />
          </DocCard>
          <DocCard title="CashGateway MID 구조">
            <DocParagraph>
              CashGateway MID(이하 CGW MID)는 내부 논리 식별자이며, PG MID와 1:1이 아닙니다.
              복수의 CGW MID가 하나의 PG MID를 공유할 수 있습니다 (N:1).
              PG는 총액 기준 승인 1건만 처리하고, Merchant별 금액 분기는 Payment Service의 책임입니다.
            </DocParagraph>
            <DocMiniFlow
              nodes={MID_NODES}
              edges={MID_EDGES}
              ownerService="CGW_MID"
            />
            <DocCallout>
              PG사는 승인 1건에 총액만 처리합니다.
              그런데 내부에는 복수의 가맹점(Merchant)이 존재하고, 각각의 정산 금액이 다릅니다.
              만약 Cash Gateway가 금액 분배까지 담당하면, PG 통신 레이어와 도메인 정산 로직이 결합됩니다.
              Cash Gateway는 "누가 요청했는지"만 식별하고, "얼마를 누구에게"는 Payment Service의 도메인으로 남겨 두었습니다.
              이렇게 하면 PG 연동을 변경해도 정산 로직에 영향이 없고, 정산 규칙을 변경해도 PG 통신 코드를 건드릴 필요가 없습니다.
            </DocCallout>
          </DocCard>
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          <DocCard title="트랜잭션 라이프사이클 : 내부와 외부 분리">
            <DocParagraph>
              사용자의 거래 요청과 PG사의 싱크를 맞추는 라이프사이클을 분리했습니다.
              트랜잭션 경계를 명확히 처리하여, 외부 서비스의 상태 및 장애와 엮이지 않도록 설계했습니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// 1. 사용자 요청 경계 — PaymentProcess를 UNKNOWN으로 기록만 한다
//    실제 PG HTTP 통신은 이 트랜잭션에 포함하지 않는다
@Transactional(propagation = Propagation.MANDATORY)
override fun payment(paymentCtx: ApprovePaymentCtx) {
    val request = provider.prepareRequest(paymentCtx)
    val jsonBody = objectMapper.writeValueAsString(request) // 직렬화 검증

    val process = domainConverterAdapter.convert(...)
    process.requestPayload = jsonBody
    paymentGatewayCoreService.handleRequest(process)  // UNKNOWN 상태 저장
}

// 2. 외부 통신 경계 — 폴링 스케줄러가 UNKNOWN을 조회하여 PG에 전송
@Scheduled(fixedDelay = 2000, initialDelay = 5000)
fun pollAndRequest() {
    val unknowns = repository.findByStatusWithLimit(UNKNOWN, limit=10)
    unknowns.forEach { process ->
        val response = pgRestTemplate.postForEntity(endpoint, request)
        // CAS: UNKNOWN → PENDING (동시 처리 방지)
        repository.casUpdateToPending(process.id, expectedStatus=UNKNOWN)
    }
}

// 3. Webhook 수신 — 3단계 파이프라인
@Transactional(propagation = Propagation.MANDATORY)
override fun handleWebhook(rawPayload: String) {
    val response = provider.parsePaymentResponse(rawPayload) // Step 1: 파싱
    val cgwMid = resolveCashGatewayMid(pgMid, userId)        // Step 2: MID 특정
    val pending = findPendingByCashGatewayMidAndProvider(...)  // Step 3: 거래 식별
    if (pending != null) handleInternalWebhook(...)            //   내부 거래
    else handleExternalWebhook(...)                            //   외부 거래
}`}</DocCode>
            <DocMiniFlow
              nodes={STATE_NODES}
              edges={STATE_EDGES}
            />
          </DocCard>

          <DocCard title="Provider 레지스트리 : 바인드와 델리게이트">
            <DocParagraph>
              PG사별 구현체는 Spring이 자동 수집하여 레지스트리에 등록합니다.
              서비스 코드는 Provider enum으로 bind하면, 레지스트리가 해당 구현체를 찾아 델리게이트합니다.
              프로토콜 코어는 어떤 PG인지 알 필요 없이 Provider 인터페이스에만 의존합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// 1. 레지스트리 — Spring이 모든 Client 구현체를 자동 수집
@Component
class PaymentGatewayClientRegistry(
    clients: List<PaymentGatewayClientProtocol>
) {
    private val clientMap = clients.associateBy { it::class.java }

    fun getClientByProvider(provider: Provider): PaymentGatewayClientProtocol {
        return clientMap.values.find { it.getProvider() == provider }
            ?: throw CustomRuntimeException("Provider에 해당하는 Client 없음")
    }
}

// 2. 파사드 — bind()로 Provider를 지정하면 레지스트리에서 조회 후 델리게이트
@Component
class PaymentGatewayClient(
    private val registry: PaymentGatewayClientRegistry
) {
    fun bind(provider: Provider): PaymentGatewayClientProtocol {
        val delegate = registry.getClientByProvider(provider)
        return PaymentGatewayClientRunner(delegate)
    }
}

// 3. 사용 — 서비스 코드는 bind만 호출
paymentGatewayClient.bind(request.provider).payment(ctx)`}</DocCode>
            <DocCode language="kotlin">{`// 4. Provider 인터페이스 — PG별 포맷 차이를 추상화
interface PaymentGatewayProvider {
    fun getProvider(): Provider
    fun prepareRequest(paymentCtx: PaymentCtx): PaymentRequest
    fun parsePaymentResponse(payload: String): PaymentResponse
    fun isSuccess(response: PaymentResponse): Boolean
}

// 5. 새 PG 추가: @Component로 등록만 하면 레지스트리가 자동 인식
@Component
class TossPaymentGatewayProvider : PaymentGatewayProvider { ... }`}</DocCode>
            <DocCode>{`호출 흐름:

  Service.approve(provider=DUMMY)
    → PaymentGatewayClient.bind(DUMMY)
      → Registry.getClientByProvider(DUMMY)
        → DummyPaymentGatewayClient (extends ProtocolCore)
          → ProtocolCore.payment()
            → provider.prepareRequest()   ← DummyProvider에 델리게이트
            → paymentGatewayCoreService.handleRequest()  ← 공통 저장`}</DocCode>
          </DocCard>

        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <DocParagraph>
            Cash Gateway의 설계는 이전에 개인적으로 진행했던 결제 시스템 프로젝트에서 출발했습니다.
            햄스터 월드의 각 서비스들의 바운디드 컨텍스트로 확장해보았습니다.
          </DocParagraph>
          <DocLink
            href="https://github.com/gtypeid/payment-system"
            label="payment-system"
            desc="이 프로젝트의 시작점이 되는 결제 시스템 레포지토리"
          />

          <DocCard title="PaymentProcess (formerly PaymentAttempt)">
            <DocParagraph>
              기존 모놀리식 구조에서는 PaymentAttempt를 외부 결제 요청에 대한 이력 엔티티로 사용했으며,
              이력은 항상 남아야 하므로 REQUIRES_NEW 트랜잭션으로 관리했습니다.
              이벤트 지향 아키텍처로 전환하면서 결제 결과는 비동기 Webhook으로 확정되는 구조가 되었고,
              PaymentAttempt는 더 이상 &quot;무조건 남아야 하는 이력&quot;이 아니라,
              결제 확정 이전의 의사(Intent)와 상태(State)를 표현하는 도메인 엔티티이자
              트랜잭션 내에서 상태 전이가 이루어지는 상태 머신의 성향을 갖게 되었습니다.
              이에 따라 MANDATORY 트랜잭션으로 전환하고, 이름도 PaymentProcess로 변경했습니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// 모놀리식: 이력이므로 독립 트랜잭션으로 항상 기록
@Transactional(propagation = Propagation.REQUIRES_NEW)
fun createAttempt(request: PaymentRequest): PaymentAttempt { ... }`}</DocCode>
            <DocMiniFlow
              nodes={BEFORE_ENTITY_NODES}
              edges={BEFORE_ENTITY_EDGES}
              direction="LR"
              height={160}
            />
            <DocCode language="kotlin">{`// 현재: 상태 머신이므로 호출자의 트랜잭션에 참여
@Transactional(propagation = Propagation.MANDATORY)
fun payment(paymentCtx: ApprovePaymentCtx) {
    val process = domainConverterAdapter.convert(...)
    process.requestPayload = jsonBody
    paymentGatewayCoreService.handleRequest(process)  // UNKNOWN 상태 저장
}`}</DocCode>
            <DocMiniFlow
              nodes={AFTER_ENTITY_NODES}
              edges={AFTER_ENTITY_EDGES}
              direction="LR"
              height={180}
            />
            <DocCallout>
              PaymentProcess는 상태 전이가 있는 가변 엔티티(CAS 기반)이고,
              Payment는 불변의 확정 기록입니다.
              처음에는 둘 다 Cash Gateway에 있었으나,
              결제 확정 기록의 진실의 원천이 두 서비스에 동시에 존재할 수 없으므로
              Payment를 Payment Service로 이동했습니다.
              외부 요청의 원본 이력 보존에 의한 REQUIRES_NEW에 준하는 비즈니스 기록이 필요하다면,
              PaymentLog와 같은 별도의 사실(Fact) 기록 엔티티를 추가 예정입니다.
            </DocCallout>
          </DocCard>
        </DocBlock>
      </div>
    ),
  },
  {
    key: 'flow',
    label: '카프카 토폴로지',
    content: <ServiceFlowSection data={cashGatewayFlow} />,
    doc: true,
  },
  {
    key: 'context',
    label: '바운디드 컨텍스트',
    content: <BoundedContextSection data={cashGatewayContext} />,
    doc: true,
  },
];

export function CashGatewayTab() {
  return (
    <ServiceDocLayout
      title="캐시 게이트웨이"
      sections={sections}
    />
  );
}
