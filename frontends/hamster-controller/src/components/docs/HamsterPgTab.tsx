import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

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
            햄스터 PG는 외부 PG 더미 시뮬레이터입니다.
            햄스터 월드의 일부가 아닌, 독립된 외부 서비스로 간주하였으며,
            결제 플로우 전체를 테스트할 수 있도록 만들었습니다.
          </DocParagraph>
          <DocCallout>
            Kafka를 사용하지 않습니다.
            REST API로 결제 요청을 접수하고,
            결과를 비동기로서 Webhook으로 Cash Gateway에 전달합니다.
          </DocCallout>
        </DocBlock>

        {/* 서비스 설명 */}
        <DocBlock id="svc-desc" title="서비스 설명">
          <DocParagraph>
            Cash Gateway로부터 결제 요청을 REST API로 접수하고,
            2초 간격 폴링 스케줄러로 비동기 처리한 뒤,
            결과를 Webhook으로 Cash Gateway에 전달합니다.
            80% 확률로 성공, 20% 확률로 실패를 시뮬레이션합니다.
          </DocParagraph>
          <DocCard title="엔티티 분리 — PaymentProcess vs Payment">
            <DocParagraph>
              거래 시도 이력(PaymentProcess)과 확정된 결과(Payment)를 분리합니다.
              PaymentProcess는 PENDING → PROCESSING → SUCCESS/FAILED 전체 라이프사이클을 기록하고,
              Payment는 CAS로 확정된 유의미한 결과만 기록합니다.
            </DocParagraph>
            <DocCode>{`PaymentProcess (거래 시도 이력)
  PENDING → PROCESSING → SUCCESS or FAILED
  모든 시도를 기록 (디버깅, 감사 목적)

Payment (확정 결과)
  COMPLETED or FAILED (중간 상태 없음)
  PaymentProcessEventHandler를 통해서만 생성
  Webhook은 Payment 기준으로 전송`}</DocCode>
            <DocCallout>
              PaymentProcess가 PROCESSING 상태에서 타임아웃되면 SUCCESS도 FAILED도 아닙니다.
              이 경우 Payment는 생성되지 않으며, Webhook도 발송되지 않습니다.
              PaymentProcess만 남아서 "시도했으나 결과 없음" 상태를 기록합니다.
            </DocCallout>
          </DocCard>
          <DocCard title="MID — 가맹점 식별자 관리">
            <DocParagraph>
              PgMid는 가맹점에게 발급하는 식별 정보입니다.
              midId(고유 식별자), apiKey(HMAC 서명 검증용), webhookUrl(결과 콜백 URL)을 관리합니다.
              앱 시작 시 DataInitializer가 Cash Gateway용 더미 MID를 자동 생성합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// PgMid — 가맹점 식별 정보
class PgMid(
    val midId: String,          // "MID_1643961234_5678"
    val merchantName: String,
    val apiKey: String,         // UUID 기반 (HMAC 서명용)
    val webhookUrl: String,     // 결과 콜백 URL
    var isActive: Boolean = true
)

// 앱 시작 시 자동 생성
companion object {
    const val DUMMY_MID_ID = "hamster_dummy_mid_001"
    const val WEBHOOK_PATH = "/api/webhook/pg/DUMMY"
}`}</DocCode>
          </DocCard>
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          <DocCard title="결제 요청 접수 → 폴링 → Webhook 전체 흐름">
            <DocCode>{`1. 결제 요청 접수
   POST /api/payment-process → 202 Accepted (ACK만 반환)
   PaymentProcess 생성 (status=PENDING)

2. 폴링 스케줄러 (2초 간격)
   SELECT WHERE status=PENDING LIMIT 10 (FIFO)
   ├─ CAS Phase 1: PENDING → PROCESSING (선점)
   ├─ 결과 생성: 80% 성공 / 20% 실패
   └─ CAS Phase 2: PROCESSING → SUCCESS or FAILED

3. 이벤트 발행 → Payment 생성
   InternalPaymentProcessSucceededEvent → Payment(COMPLETED)
   InternalPaymentProcessFailedEvent   → Payment(FAILED)

4. Webhook 전송
   WebClient POST → Cash Gateway webhookUrl
   5초 타임아웃, 재시도 없음 (fire-and-forget)`}</DocCode>
          </DocCard>

          <DocCard title="CAS 기반 동시성 제어 — 2단계 상태 전이">
            <DocParagraph>
              모든 상태 전이는 CAS(Compare-And-Swap)로 수행됩니다.
              QueryDSL UPDATE에 WHERE status = 기대상태 조건을 추가하여,
              이미 다른 스케줄러가 처리 중인 건을 건너뜁니다.
              반환값이 0이면 이미 처리된 것이므로 무시합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// CAS Phase 1: PENDING → PROCESSING (선점)
fun casUpdateToProcessing(id: Long, expectedStatus, newStatus, processingStartedAt): Int {
    return jpaQueryFactory
        .update(qPaymentProcess)
        .set(qPaymentProcess.status, newStatus)
        .set(qPaymentProcess.processingStartedAt, processingStartedAt)
        .where(
            qPaymentProcess.id.eq(id)
                .and(qPaymentProcess.status.eq(expectedStatus))  // CAS 조건
        )
        .execute().toInt()
}

// CAS Phase 2: PROCESSING → SUCCESS/FAILED (최종)
fun casUpdateToFinal(id: Long, expectedStatus, newStatus, approvalNo, failReason, processedAt): Int {
    return jpaQueryFactory
        .update(qPaymentProcess)
        .set(qPaymentProcess.status, newStatus)
        .set(qPaymentProcess.approvalNo, approvalNo)
        .set(qPaymentProcess.failReason, failReason)
        .set(qPaymentProcess.processedAt, processedAt)
        .where(
            qPaymentProcess.id.eq(id)
                .and(qPaymentProcess.status.eq(expectedStatus))
        )
        .execute().toInt()
}`}</DocCode>
          </DocCard>

          <DocCard title="실패 시뮬레이션">
            <DocParagraph>
              20% 확률로 실패 시 5가지 사유 중 하나를 랜덤 선택합니다.
              실제 PG의 실패 유형을 모방하여 Cash Gateway의 에러 처리 로직을 테스트할 수 있습니다.
            </DocParagraph>
            <DocCode language="kotlin">{`companion object {
    private const val SUCCESS_RATE = 80
    private val FAIL_REASONS = listOf(
        "INSUFFICIENT_BALANCE",  // 잔액 부족
        "INVALID_CARD",          // 유효하지 않은 카드
        "EXPIRED_CARD",          // 만료된 카드
        "LIMIT_EXCEEDED",        // 한도 초과
        "STOLEN_CARD"            // 도난 카드
    )
}

val isSuccess = Random.nextInt(100) < SUCCESS_RATE  // 0~79: 성공
val failReason = FAIL_REASONS.random()              // 랜덤 사유`}</DocCode>
          </DocCard>

          <DocCard title="Webhook 전송 — Fire-and-Forget">
            <DocParagraph>
              Payment가 생성되면 NotificationService가 WebClient로 Webhook을 전송합니다.
              MID의 webhookUrl을 조회하여 결과 페이로드를 전달하며,
              5초 타임아웃 내에 응답하지 않으면 실패로 기록합니다.
              재시도는 하지 않으며, 필요 시 수동 재발송 API를 제공합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// NotificationService — Webhook 발송
fun sendNotification(payment: Payment) {
    val pgMid = pgMidService.getMid(payment.midId)

    try {
        webClient.post()
            .uri(pgMid.webhookUrl)
            .bodyValue(buildPayload(payment))  // tid, status, amount, echo, ...
            .retrieve()
            .toBodilessEntity()
            .timeout(Duration.ofSeconds(5))
            .block()

        payment.markNotificationSent()
    } catch (e: Exception) {
        payment.markNotificationFailed(e.message ?: "Unknown error")
    }
    paymentRepository.save(payment)
}

// 페이로드 구조
private fun buildPayload(payment: Payment) = mapOf(
    "tid" to payment.tid, "midId" to payment.midId,
    "status" to payment.status.name, "amount" to payment.amount,
    "approvalNo" to payment.approvalNo, "failureReason" to payment.failureReason,
    "echo" to payment.echo  // Cash Gateway가 보낸 원본 데이터 반환
)`}</DocCode>
          </DocCard>
        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <DocParagraph>
            햄스터 PG는 Cash Gateway의 폴링 기반 PG 통신 패턴과 동일한 구조를 사용합니다.
            Cash Gateway가 UNKNOWN → PENDING(폴링 전송) → SUCCESS/FAILED(Webhook 수신) 흐름을 따르듯,
            햄스터 PG도 PENDING → PROCESSING(폴링 처리) → SUCCESS/FAILED(Webhook 전송) 흐름을 따릅니다.
            양쪽이 대칭적으로 동작하여 전체 결제 플로우를 완결합니다.
          </DocParagraph>
        </DocBlock>
      </div>
    ),
  },
];

export function HamsterPgTab() {
  return (
    <ServiceDocLayout
      title="햄스터 PG"
      sections={sections}
    />
  );
}
