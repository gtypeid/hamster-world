package com.hamsterworld.common.web.kafka

import java.time.LocalDateTime
import java.util.UUID

/**
 * 모든 도메인 이벤트의 기본 인터페이스
 *
 * 각 서비스는 이 인터페이스를 구현하여 자신만의 도메인 이벤트를 정의합니다.
 * Common 모듈에는 구체적인 이벤트 클래스를 정의하지 않습니다.
 *
 * 예시:
 * ```kotlin
 * // ecommerce-service/domain/product/event/ProductEvents.kt
 * data class ProductCreatedEvent(...) : EcommerceDomainEvent(
 *     aggregateId = product.publicId,
 *     aggregateType = "Product"   // AbsDomain 하위 클래스의 simpleName
 * )
 * ```
 */
interface DomainEvent {
    /**
     * 이벤트 고유 ID
     */
    val eventId: String

    /**
     * 이벤트가 발생한 Aggregate의 Public ID (NOT Internal ID)
     * - Public ID (Snowflake Base62)를 사용해야 함
     * - Internal ID (Long)를 절대 사용하지 말 것
     * - 이벤트 순서 보장 및 파티셔닝에 사용
     */
    val aggregateId: String

    /**
     * Aggregate 타입 (AbsDomain 하위 클래스의 simpleName)
     *
     * aggregateId만으로는 어떤 엔티티의 ID인지 알 수 없으므로,
     * 해당 ID가 속한 도메인 엔티티 타입을 명시합니다.
     *
     * 예시: "Order", "Product", "Payment", "User"
     */
    val aggregateType: String

    /**
     * 분산 추적 ID (OpenTelemetry Trace ID)
     * 여러 서비스를 거치는 이벤트 체인을 추적하기 위한 ID (32자 hex)
     * 첫 이벤트에서 생성되고, 후속 이벤트에 전파됨
     *
     * WARNING: null이면 안 됨! DomainEventPublisher에서 자동 생성하지만,
     * 명시적으로 OpenTelemetry의 현재 trace ID를 가져오는 것을 권장
     */
    val traceId: String?

    /**
     * 분산 추적 Span ID (OpenTelemetry Span ID)
     * 현재 span의 ID (16자 hex)
     * Kafka consumer에서 parent span으로 설정하여 trace tree에 연결
     */
    val spanId: String?

    /**
     * 이벤트 발생 시각
     */
    val occurredAt: LocalDateTime
}

/**
 * 도메인 이벤트 기본 구현
 *
 * 각 서비스에서 이 클래스를 상속받아 구체적인 이벤트를 정의할 수 있습니다.
 * 일반적으로는 서비스별 Base 클래스(EcommerceDomainEvent, PaymentDomainEvent 등)를 사용하는 것을 권장합니다.
 *
 * @param aggregateId 이벤트가 발생한 Aggregate의 Public ID (필수, NOT Internal ID)
 * @param aggregateType Aggregate 타입 (AbsDomain 하위 클래스의 simpleName, 예: "Order", "Product")
 * @param eventId 이벤트 고유 ID (자동 생성)
 * @param traceId OpenTelemetry Trace ID (32자 hex)
 * @param spanId OpenTelemetry Span ID (16자 hex)
 * @param occurredAt 이벤트 발생 시각 (자동 생성)
 * @param topic Kafka 토픽 이름 (필수)
 */
abstract class BaseDomainEvent(
    override val aggregateId: String,
    override val aggregateType: String,
    override val eventId: String = UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val spanId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now(),
    open val topic: String
) : DomainEvent
