import { ServiceDocLayout, DocBlock } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '프로젝트 의도' },
      { key: 'svc-desc', label: '프로젝트 설명' },
      { key: 'svc-design', label: '핵심 설계' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        {/* 프로젝트 의도 */}
        <DocBlock id="svc-intent" title="프로젝트 의도">
          <>{/* TODO: 내용 작성 예정
          <DocParagraph>
            햄스터 월드는 결제 중개 플랫폼(PG Aggregator) 아키텍처의 이벤트 드리븐 이커머스 시스템입니다.
            토스페이먼츠, 이니시스와 같은 결제 대행 서비스를 모델링합니다.
          </DocParagraph>
          <DocParagraph>
            PG Aggregator라는 도메인을 선택한 이유는 결제 시스템이 트랜잭션 정합성, 비동기 이벤트 처리,
            멱등성, 보상 트랜잭션 등 백엔드 핵심 과제를 자연스럽게 포함하기 때문입니다.
            단순한 CRUD가 아닌, 실제 운영 환경에서 마주하는 문제들을 직접 설계하고 해결하는 것이 목적입니다.
          </DocParagraph>
          <DocCallout>
            모든 서비스는 AWS 프리티어 내에서 온디맨드로 생성·삭제됩니다.
            Terraform + GitHub Actions로 8개 EC2 인스턴스를 자동 프로비저닝하며,
            이 대시보드(Hamster Controller)가 인프라 제어의 엔트리 포인트 역할을 합니다.
          </DocCallout>
          */}</>
        </DocBlock>

        {/* 프로젝트 설명 */}
        <DocBlock id="svc-desc" title="프로젝트 설명">
          <>{/* TODO: 내용 작성 예정
          <DocCard title="비즈니스 모델 — PG Aggregator">
            <DocParagraph>
              가맹점(Vendor)은 두 가지 결제 경로를 선택할 수 있습니다.
              직접 PG 계약(낮은 수수료)과 햄스터 월드 중개(높은 수수료)입니다.
              Cash Gateway가 이 두 경로를 모두 오케스트레이션합니다.
            </DocParagraph>
            <DocCode>{`가맹점 결제 경로

경로 A: 직접 PG 계약 (낮은 수수료)
  Ecommerce → 외부 PG → Cash Gateway (Webhook 수신만)

경로 B: 햄스터 중개 (높은 수수료)
  Ecommerce → Cash Gateway → 외부 PG → Cash Gateway (Webhook 수신)`}</DocCode>
          </DocCard>
          <DocCard title="서비스 구성">
            <DocKeyValueList items={[
              { label: 'ecommerce-service', value: '상품·주문·장바구니·가맹점·쿠폰 관리. 읽기 전용 캐시 동기화 모델', color: 'text-blue-400' },
              { label: 'payment-service', value: '재고·정산·잔액의 진실의 원천. HTTP 없이 Kafka 구독만으로 동작', color: 'text-red-400' },
              { label: 'cash-gateway', value: 'PG 통신 오케스트레이션. 결제 요청·승인·취소 프로토콜 관리', color: 'text-amber-400' },
              { label: 'progression', value: '게이미피케이션 (아카이브·반복 보상·시즌 프로모션). CSV 마스터 데이터', color: 'text-purple-400' },
              { label: 'hamster-pg', value: 'PG 시뮬레이터. REST + Webhook, Kafka 미사용', color: 'text-emerald-400' },
              { label: 'notification', value: 'DLT 모니터링 + 카프카 토폴로지 시각화. MongoDB 저장', color: 'text-gray-400' },
            ]} />
          </DocCard>
          <DocCard title="Kafka 이벤트 토폴로지">
            <DocCode>{`ecommerce-events      Ecommerce → Payment, Progression
payment-events        Payment → Ecommerce, Cash Gateway
cash-gateway-events   Cash Gateway → Payment
progression-events    Progression → Payment
*-events-dlt          All → Notification (Dead Letter)`}</DocCode>
            <DocCallout>
              Payment Service는 REST API가 없습니다.
              외부 요청을 직접 받지 않고, Kafka 이벤트 구독만으로 모든 비즈니스 로직을 수행합니다.
              이것이 이벤트 드리븐 아키텍처에서 "반응형 서비스"의 극단적 형태입니다.
            </DocCallout>
          </DocCard>
          */}</>
        </DocBlock>

        {/* 핵심 설계 */}
        <DocBlock id="svc-design" title="핵심 설계">
          <>{/* TODO: 내용 작성 예정
          <DocCard title="아키텍처 원칙">
            <DocKeyValueList labelWidth="w-20" items={[
              { label: 'DDD', value: 'Aggregate Root + Domain Events 기반 바운디드 컨텍스트 분리', color: 'text-emerald-400' },
              { label: 'CQRS', value: 'Ecommerce (읽기 모델, 캐시 동기화) vs Payment (쓰기 모델, 진실의 원천)', color: 'text-blue-400' },
              { label: 'EDA', value: 'Kafka 4개 토픽 + DLT. Outbox 패턴, 멱등성 소비자', color: 'text-red-400' },
              { label: 'Saga', value: '주문 → 재고 선차감 → PG 결제 → 확정 또는 보상 트랜잭션 롤백', color: 'text-purple-400' },
              { label: 'CAS', value: '모든 상태 전이에 Compare-And-Swap. 비관적 락 대신 낙관적 동시성 제어', color: 'text-amber-400' },
            ]} />
          </DocCard>
          <DocCard title="서비스 간 경계 — 진실의 원천 분리">
            <DocParagraph>
              각 서비스는 자신의 도메인에서 진실의 원천을 소유합니다.
              다른 서비스의 데이터가 필요하면 이벤트를 통해 읽기 전용 캐시를 동기화합니다.
              이 원칙이 서비스 간 결합도를 최소화합니다.
            </DocParagraph>
            <DocCode>{`진실의 원천 소유 관계

Ecommerce   — 주문 전표, 상품 카탈로그, 장바구니, 가맹점, 쿠폰
Payment     — 재고(Stock), 정산(Account), 잔액(Balance)
Cash Gateway — PG 결제 프로세스, 가맹점 MID 매핑
Progression — 아카이브, 반복 보상, 시즌 프로모션 진행 상태

읽기 전용 캐시 (이벤트 동기화)
  Ecommerce.Product.stock     ← Payment (재고 변경 이벤트)
  Ecommerce.Account.balance   ← Payment (잔액 변경 이벤트)
  Ecommerce.Order.status      ← Cash Gateway (결제 결과 이벤트)`}</DocCode>
          </DocCard>
          <DocCard title="Outbox 패턴 + 멱등성 소비자">
            <DocParagraph>
              모든 서비스는 Outbox 패턴으로 이벤트를 발행합니다.
              BEFORE_COMMIT에 outbox 테이블에 저장하고, 스케줄러가 Kafka로 릴레이합니다.
              소비 측은 eventId 기반 중복 검사로 멱등성을 보장합니다.
            </DocParagraph>
            <DocCode>{`이벤트 발행 (Outbox 패턴)
  비즈니스 로직 실행
  → BEFORE_COMMIT: OutboxEvent 저장 (traceId 포함)
  → 스케줄러: outbox 테이블 폴링 → Kafka 발행 → traceId 복원

이벤트 소비 (멱등성 보장)
  Kafka 메시지 수신
  → ProcessedEvent 테이블에서 eventId 중복 검사
  → 중복이면 무시, 신규면 처리 + eventId 기록`}</DocCode>
          </DocCard>
          <DocCard title="주문 Saga 흐름">
            <DocCode>{`1. 주문 생성 (Ecommerce)
   Cart → Order 변환, CAS로 CREATED 상태 확정
   → OrderCreatedEvent 발행

2. 재고 선차감 (Payment)
   ProductRecord.stock CAS 차감
   → OrderStockReservedEvent 또는 OrderStockFailedEvent 발행

3. PG 결제 (Cash Gateway → Hamster PG)
   PaymentProcess 생성, 외부 PG 요청
   → Webhook 수신 → PaymentApprovedEvent 또는 PaymentFailedEvent 발행

4. 최종 확정 또는 롤백
   성공: Order → PAID, 정산 기록 생성, 잔액 차감
   실패: Order → CANCELLED, 재고 복원 (보상 트랜잭션)`}</DocCode>
          </DocCard>
          */}</>
        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <>{/* TODO: 내용 작성 예정
          <DocParagraph>
            이 프로젝트의 핵심은 "실제로 동작하는 결제 시스템"을 만드는 것이었습니다.
            단순히 아키텍처 다이어그램을 그리는 것이 아니라,
            Kafka 이벤트가 실제로 흐르고, CAS로 동시성을 제어하고,
            보상 트랜잭션이 실제로 롤백되는 시스템을 구현했습니다.
          </DocParagraph>
          <DocParagraph>
            Hamster Controller는 이 모든 것을 시연하기 위한 도구입니다.
            GitHub Pages에 정적 배포되어 별도 서버 없이 동작하며,
            Lambda Proxy를 통해 GitHub PAT을 노출하지 않고 인프라를 제어합니다.
          </DocParagraph>
          */}</>
        </DocBlock>
      </div>
    ),
  },
];

export function OverviewTab() {
  return (
    <ServiceDocLayout
      title="개요"
      sections={sections}
    />
  );
}
