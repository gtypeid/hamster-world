package com.hamsterworld.common.web.kafka

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.hamsterworld.common.domain.processedevent.model.ProcessedEvent
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.common.web.threadlocal.AuditContext
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import org.slf4j.LoggerFactory
import org.springframework.kafka.support.Acknowledgment
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Base Kafka Consumer
 *
 * 모든 Kafka 컨슈머의 공통 로직을 제공하는 추상 클래스
 *
 * ## 제공 기능
 * 1. **JSON 파싱**: Kafka 메시지를 Map으로 파싱
 * 2. **이벤트 메타데이터 추출**: eventType, eventId, timestamp, payload 추출
 * 3. **YML 기반 이벤트 필터링**: kafka-event-registry.yml에 등록된 이벤트만 처리
 * 4. **멱등성 보장**: eventId 기반 중복 처리 방지 (자동)
 * 5. **에러 처리**: 파싱 실패 시 예외 발생 (KafkaErrorHandler가 처리)
 * 6. **Acknowledgment**: 메시지 처리 완료 후 자동 ack
 *
 * ## 사용법
 *
 * ```kotlin
 * @Component
 * class ProductEventConsumer(
 *     objectMapper: ObjectMapper,
 *     processedEventRepository: ProcessedEventRepository,
 *     eventRegistryProperties: EventRegistryProperties,
 *     private val productService: ProductService,
 *     @Value("\${kafka.topics.ecommerce-events}") topicName: String
 * ) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, topicName) {
 *
 *     @KafkaListener(topics = ["\${kafka.topics.ecommerce-events}"], ...)
 *     fun consumeEvent(message: String, ack: Acknowledgment) {
 *         super.consumeEvent(message, ack)
 *     }
 *
 *     override fun handleEvent(parsedEvent: ParsedEvent) {
 *         when (parsedEvent.eventType) {
 *             "ProductCreatedEvent" -> {
 *                 val event = objectMapper.convertValue(parsedEvent.payload, ...)
 *                 productService.createProduct(event)
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * ## YML 기반 이벤트 필터링
 * - **kafka-event-registry.yml**에 등록된 이벤트만 처리
 * - 등록되지 않은 이벤트는 즉시 ack (processed_events 저장 안 함)
 *
 * ## 멱등성 보장 (자동)
 * - **eventId 기반 중복 체크**: processedEventRepository로 자동 처리
 * - **모든 Consumer에 적용**: eventId가 있으면 무조건 체크
 * - **Business Key는 추가 보호**: SKU, orderNumber 등은 선택적 2차 체크
 *
 * ## 템플릿 메서드 패턴
 * - consumeEvent(): 공통 로직 (파싱, 필터링, 멱등성 체크, 에러 처리, ack)
 * - handleEvent(): 하위 클래스에서 구현 (비즈니스 로직만 집중)
 *
 * @param objectMapper Jackson ObjectMapper
 * @param processedEventRepository ProcessedEvent Repository (필수, 멱등성 보장)
 * @param eventRegistryProperties Event Registry 설정 (kafka-event-registry.yml)
 * @param currentTopic 현재 Consumer가 구독하는 토픽 이름
 * @see ParsedEvent
 */
abstract class BaseKafkaConsumer(
    protected val objectMapper: ObjectMapper,
    private val processedEventRepository: ProcessedEventRepository,
    private val eventRegistryProperties: EventRegistryProperties,
    private val currentTopic: String
) {
    protected val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 현재 토픽에서 구독하는 이벤트 목록 (YML 기반)
     *
     * kafka-event-registry.yml에서 로드됨
     * EventRegistryProperties의 @PostConstruct에서 placeholder 해결 완료 후 접근
     * 빈 Set인 경우 = YML 설정 누락 (EventRegistryValidator가 애플리케이션 시작 시 검증)
     */
    private fun getSubscribedEvents(): Set<String> {
        return eventRegistryProperties.getSubscribedEvents(currentTopic)
    }

    /**
     * Kafka 메시지 파싱
     *
     * JSON 메시지를 ParsedEvent로 변환
     * - eventType: 필수 (없으면 예외)
     * - aggregateId: 필수 (없으면 예외)
     * - metadata: metadata.eventId, metadata.traceId 추출
     * - traceId가 있으면 AuditContextHolder에 설정 (분산 추적)
     * - payload: 필수
     *
     * @param message Kafka 메시지 (JSON 문자열)
     * @return ParsedEvent
     * @throws IllegalArgumentException eventType, aggregateId 또는 payload가 없을 때
     */
    protected fun parseEvent(message: String): ParsedEvent {
        val eventData = objectMapper.readValue<Map<String, Any>>(message)

        val eventType = eventData["eventType"] as? String
            ?: throw IllegalArgumentException("Missing eventType in event")

        val aggregateId = eventData["aggregateId"] as? String
            ?: throw IllegalArgumentException("Missing aggregateId in event")

        val metadata = eventData["metadata"] as? Map<*, *>
        val eventId = metadata?.get("eventId") as? String
        val traceId = metadata?.get("traceId") as? String
        val spanId = metadata?.get("spanId") as? String
        val timestamp = (metadata?.get("occurredAt") as? String)?.let {
            // ISO 8601 문자열을 timestamp로 변환하거나 그냥 사용
            null  // 일단 null로 유지
        }

        // AuditContext 설정 (로깅용)
        // Note: OpenTelemetry trace context는 OTel 자동 계측이 Kafka 헤더에서 복원함
        //       수동으로 setTraceContext()를 호출하면 오히려 충돌 발생
        if (traceId != null) {
            AuditContextHolder.setContext(AuditContext(traceId = traceId))
            logger.debug("Set AuditContext for logging: traceId={}", traceId)
        } else {
            logger.warn("Missing traceId in Kafka event metadata", )
        }

        val payload = eventData["payload"] as? Map<String, Any>
            ?: throw IllegalArgumentException("Missing payload")

        return ParsedEvent(
            eventType = eventType,
            eventId = eventId,
            timestamp = timestamp,
            traceId = traceId,
            aggregateId = aggregateId,
            payload = payload
        )
    }

    /**
     * 이벤트 처리 (하위 클래스에서 구현)
     *
     * 파싱된 이벤트를 받아서 비즈니스 로직 수행
     * - when (parsedEvent.eventType) 분기로 처리
     * - objectMapper.convertValue()로 DTO 변환
     *
     * **주의**: 반드시 @Transactional(propagation = Propagation.MANDATORY)를 선언해야 함
     * → consumeEvent()의 트랜잭션에 참여하여 원자성 보장
     *
     * @param parsedEvent 파싱된 이벤트
     */
    @Transactional(propagation = Propagation.MANDATORY)
    protected abstract fun handleEvent(parsedEvent: ParsedEvent)

    /**
     * Kafka 메시지 소비 (템플릿 메서드)
     *
     * 1. 메시지 파싱
     * 2. 멱등성 체크 (ProcessedEvent 존재 시)
     * 3. 이벤트 처리 (handleEvent)
     * 4. 처리 이력 저장 (ProcessedEvent)
     * 5. Acknowledgment
     * 6. 에러 발생 시 예외 던지기 (KafkaErrorHandler가 처리)
     *
     * ## 트랜잭션 보장
     * - @Transactional로 전체 처리를 하나의 트랜잭션으로 묶음
     * - 비즈니스 로직 처리 + ProcessedEvent 저장이 원자적으로 실행
     * - 둘 중 하나라도 실패하면 전체 롤백 → 메시지 재처리
     *
     * ## 멱등성 보장 (자동)
     * - eventId가 있으면 무조건 중복 체크 수행
     * - 이미 처리된 이벤트는 handleEvent() 호출 안 함
     * - DB Transaction 내에서 비즈니스 로직 + ProcessedEvent 저장을 함께 수행
     * - At-Least-Once Delivery 환경에서 완벽한 멱등성 보장
     *
     * @param message Kafka 메시지
     * @param ack Acknowledgment
     */
    @Transactional(propagation = Propagation.MANDATORY)
    protected open fun consumeEvent(message: String, ack: Acknowledgment) {
        logger.debug("Received event: {}", message)

        try {
            val parsedEvent = parseEvent(message)
            logger.debug(
                "Processing event: type={}, aggregateId={}, eventId={}, traceId={}",
                parsedEvent.eventType, parsedEvent.aggregateId, parsedEvent.eventId, parsedEvent.traceId
            )

            // ✅ YML 기반 이벤트 필터링 (등록되지 않은 이벤트는 즉시 스킵)
            val subscribedEvents = getSubscribedEvents()
            if (!subscribedEvents.contains(parsedEvent.eventType)) {
                logger.debug(
                    "UNSUBSCRIBED_EVENT | topic={} | eventType={} | eventId={} | traceId={} | subscribedEvents={} | action=SKIP",
                    currentTopic,
                    parsedEvent.eventType,
                    parsedEvent.eventId ?: "N/A",
                    parsedEvent.traceId ?: "N/A",
                    subscribedEvents
                )
                ack.acknowledge()  // 즉시 ack, processed_events 저장하지 않음
                return
            }

            // 멱등성 체크 (eventId 기반, 무조건 수행)
            if (parsedEvent.eventId != null) {
                if (processedEventRepository.existsByEventId(parsedEvent.eventId)) {
                    logger.info(
                        "EVENT_ALREADY_PROCESSED | traceId={} | eventType={} | eventId={} | consumer={} | action=SKIP",
                        parsedEvent.traceId ?: "N/A",
                        parsedEvent.eventType,
                        parsedEvent.eventId,
                        this.javaClass.simpleName
                    )
                    ack.acknowledge()
                    return
                }
            }

            // 비즈니스 로직 처리
            handleEvent(parsedEvent)

            // 처리 이력 저장 (멱등성 보장)
            if (parsedEvent.eventId != null) {
                val processedEvent = ProcessedEvent(
                    eventId = parsedEvent.eventId,
                    eventType = parsedEvent.eventType,
                    consumedBy = this.javaClass.simpleName
                )
                processedEventRepository.save(processedEvent)
            }

            ack.acknowledge()

            // 성공 로그
            logger.info(
                "EVENT_CONSUMED_SUCCESS | traceId={} | eventType={} | aggregateId={} | eventId={} | consumer={}",
                parsedEvent.traceId ?: "N/A",
                parsedEvent.eventType,
                parsedEvent.aggregateId,
                parsedEvent.eventId ?: "N/A",
                this.javaClass.simpleName
            )
        } catch (e: Exception) {
            // 실패 로그
            val parsedEventOrNull = try {
                parseEvent(message)
            } catch (_: Exception) {
                null
            }
            logger.error(
                "EVENT_CONSUMED_FAILED | traceId={} | eventType={} | aggregateId={} | eventId={} | consumer={} | error={}",
                parsedEventOrNull?.traceId ?: "N/A",
                parsedEventOrNull?.eventType ?: "PARSE_FAILED",
                parsedEventOrNull?.aggregateId ?: "UNKNOWN",
                parsedEventOrNull?.eventId ?: "N/A",
                this.javaClass.simpleName,
                e.message,
                e
            )
            throw e  // KafkaErrorHandler가 재시도 → DLT 전송
        } finally {
            // AuditContext 정리
            AuditContextHolder.clear()
        }
    }
}

/**
 * Parsed Event
 *
 * Kafka 메시지를 파싱한 결과
 *
 * ## 메시지 구조
 * ```json
 * {
 *   "eventType": "ProductCreatedEvent",
 *   "aggregateId": "product-123",
 *   "payload": { ... },
 *   "metadata": {
 *     "eventId": "550e8400-e29b-41d4-a716-446655440000",
 *     "traceId": "trace-123",
 *     "occurredAt": "2024-01-30T12:00:00Z"
 *   }
 * }
 * ```
 *
 * @property eventType 이벤트 타입 (필수) - Consumer가 when 분기에 사용
 * @property aggregateId Aggregate ID (필수) - Kafka 파티셔닝 키, 순서 보장
 * @property eventId 이벤트 ID (선택) - 멱등성 체크용
 * @property traceId 분산 추적 ID (선택) - 로깅/추적용
 * @property timestamp 이벤트 발생 시각 (선택)
 * @property payload 페이로드 객체 (필수) - 비즈니스 데이터
 */
data class ParsedEvent(
    val eventType: String,
    val aggregateId: String,
    val eventId: String?,
    val traceId: String?,
    val timestamp: Long?,
    val payload: Map<String, Any>
)
