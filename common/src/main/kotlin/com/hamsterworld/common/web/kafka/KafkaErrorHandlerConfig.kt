package com.hamsterworld.common.web.kafka

import com.fasterxml.jackson.core.JsonProcessingException
import org.apache.kafka.clients.consumer.Consumer
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.TopicPartition
import org.apache.kafka.common.header.internals.RecordHeader
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.listener.CommonErrorHandler
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer
import org.springframework.kafka.listener.DefaultErrorHandler
import org.springframework.kafka.listener.MessageListenerContainer
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Kafka Error Handler Configuration (Common)
 *
 * 모든 서비스에서 공통으로 사용하는 Kafka 에러 핸들링 설정
 *
 * [기능]
 * - Consumer에서 예외 발생 시 자동 재시도
 * - 재시도 실패 시 DLT (Dead Letter Topic)로 자동 전송
 * - DLT 토픽명: "{original-topic}-dlt"
 *
 * [재시도 전략]
 * - 지수 백오프: 1초 → 2초 → 4초 (최대 3회)
 * - IllegalArgumentException, JsonProcessingException: 재시도 없이 즉시 DLT 이동
 *
 * [사용법]
 * - 각 서비스의 KafkaConfig에서 kafkaErrorHandler() Bean을 주입받아 사용
 * - 예시:
 *   @Bean
 *   fun kafkaListenerContainerFactory(
 *       consumerFactory: ConsumerFactory<String, String>,
 *       kafkaErrorHandler: CommonErrorHandler
 *   ): ConcurrentKafkaListenerContainerFactory<String, String> {
 *       val factory = ConcurrentKafkaListenerContainerFactory<String, String>()
 *       factory.consumerFactory = consumerFactory
 *       factory.setCommonErrorHandler(kafkaErrorHandler)
 *       return factory
 *   }
 */
@Configuration
@ConditionalOnClass(KafkaTemplate::class)
class KafkaErrorHandlerConfig {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Value("\${spring.application.name:unknown-service}")
    private lateinit var serviceName: String

    @Bean
    fun kafkaErrorHandler(kafkaTemplate: KafkaTemplate<String, String>): CommonErrorHandler {
        // DLT 토픽 이름을 계산하는 resolver (suffix: "-dlt")
        val destinationResolver = { record: ConsumerRecord<*, *>, _: Exception ->
            // ecommerce-events → ecommerce-events-dlt
            val dltTopic = "${record.topic()}-dlt"
            TopicPartition(dltTopic, record.partition())
        }

        // DLT로 메시지를 전송하는 Recoverer
        val recoverer = object : DeadLetterPublishingRecoverer(kafkaTemplate, destinationResolver) {
            override fun accept(record: ConsumerRecord<*, *>, ex: Exception) {
                // Consumer Group ID를 헤더에 추가 (어느 Consumer가 실패했는지 추적)
                val groupId = record.headers()
                    .lastHeader("kafka_groupId")?.value()?.let { String(it) }
                    ?: "unknown"

                logger.debug(">>> DeadLetterPublishingRecoverer.accept() called - Topic: ${record.topic()}, GroupId: $groupId")

                // DLT 메시지에 실패한 서비스 정보를 헤더로 추가
                val failedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                record.headers().add(RecordHeader("x-failed-service", serviceName.toByteArray()))
                record.headers().add(RecordHeader("x-failed-consumer-group", groupId.toByteArray()))
                record.headers().add(RecordHeader("x-failed-at", failedAt.toByteArray()))
                record.headers().add(RecordHeader("x-failed-reason", (ex.message ?: "Unknown error").toByteArray()))

                logger.error(
                    """
                    ========================================
                    🔴 Message sent to DLT
                    ========================================
                    Topic: ${record.topic()}
                    DLT Topic: ${record.topic()}-dlt
                    Partition: ${record.partition()}
                    Offset: ${record.offset()}
                    Key: ${record.key()}
                    Failed Service: $serviceName
                    Consumer Group: $groupId
                    Failed At: $failedAt
                    Exception: ${ex.javaClass.simpleName}
                    Message: ${ex.message}
                    ========================================
                    """.trimIndent()
                )

                logger.debug(">>> About to call super.accept()")
                super.accept(record, ex)
                logger.debug(">>> super.accept() completed")
            }
        }

        // Exponential BackOff: 1초 → 2초 → 4초 (최대 3회 재시도)
        val backOff = ExponentialBackOffWithMaxRetries(3).apply {
            initialInterval = 1000L  // 1초
            multiplier = 2.0         // 2배씩 증가
            maxInterval = 10000L     // 최대 10초
        }

        // 커스텀 ErrorHandler: 예외 발생 시 명시적 로깅
        val errorHandler = object : DefaultErrorHandler(recoverer, backOff) {
            override fun handleRemaining(
                thrownException: Exception,
                records: MutableList<ConsumerRecord<*, *>>,
                consumer: Consumer<*, *>,
                container: MessageListenerContainer
            ) {
                // Root Cause 추출 (ListenerExecutionFailedException 안의 진짜 원인)
                val rootCause = generateSequence(thrownException as Throwable) { it.cause }
                    .lastOrNull() ?: thrownException

                // Batch 처리 중 실패 시 첫 번째 레코드만 로깅 (실제 실패 원인)
                val failedRecord = records.firstOrNull()

                if (failedRecord != null) {
                    logger.error(
                        rootCause,
                        """
                        ========================================
                        ❌ Kafka Consumer Exception
                        ========================================
                        Topic: ${failedRecord.topic()}
                        Partition: ${failedRecord.partition()}
                        Offset: ${failedRecord.offset()}
                        Key: ${failedRecord.key()}
                        Value: ${failedRecord.value()}

                        📊 Batch Info:
                        - Batch Size: ${records.size} record(s)
                        - Offset Range: ${records.first().offset()} ~ ${records.last().offset()}

                        🔴 Root Cause (실제 원인):
                        - Type: ${rootCause.javaClass.name}
                        - Message: ${rootCause.message}

                        📦 Wrapper Exception:
                        - Type: ${thrownException.javaClass.name}
                        ========================================
                        """.trimIndent()
                    )
                }

                // 부모 클래스의 재시도/DLT 처리 실행
                super.handleRemaining(thrownException, records, consumer, container)
            }
        }

        /*
            데드레터 설정
         */
        return errorHandler.apply {
            // 재시도하지 않을 예외 (즉시 DLT로 이동)
            // JsonProcessingException: JSON 파싱/매핑 에러는 재시도 무의미 (메시지 자체가 잘못됨)
            // IllegalArgumentException: 비즈니스 로직 검증 실패는 재시도 무의미
            addNotRetryableExceptions(
                IllegalArgumentException::class.java,
                JsonProcessingException::class.java
            )

            logger.info("Kafka ErrorHandler initialized with exponential backoff (1s → 2s → 4s, max 3 retries)")
            logger.info("Not retryable exceptions: IllegalArgumentException, JsonProcessingException")
        }
    }
}
