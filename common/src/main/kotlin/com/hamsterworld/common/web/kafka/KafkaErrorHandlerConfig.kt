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
@Configuration
@ConditionalOnClass(KafkaTemplate::class)
class KafkaErrorHandlerConfig {
    private val logger = LoggerFactory.getLogger(javaClass)
    @Value("\${spring.application.name:unknown-service}")
    private lateinit var serviceName: String
    @Bean
    fun kafkaErrorHandler(kafkaTemplate: KafkaTemplate<String, String>): CommonErrorHandler {
        val destinationResolver = { record: ConsumerRecord<*, *>, _: Exception ->
            val dltTopic = "${record.topic()}-dlt"
            TopicPartition(dltTopic, record.partition())
        }
        val recoverer = object : DeadLetterPublishingRecoverer(kafkaTemplate, destinationResolver) {
            override fun accept(record: ConsumerRecord<*, *>, ex: Exception) {
                val groupId = record.headers()
                    .lastHeader("kafka_groupId")?.value()?.let { String(it) }
                    ?: "unknown"
                logger.debug(">>> DeadLetterPublishingRecoverer.accept() called - Topic: ${record.topic()}, GroupId: $groupId")
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
        val backOff = ExponentialBackOffWithMaxRetries(3).apply {
            initialInterval = 1000L
            multiplier = 2.0
            maxInterval = 10000L
        }
        val errorHandler = object : DefaultErrorHandler(recoverer, backOff) {
            override fun handleRemaining(
                thrownException: Exception,
                records: MutableList<ConsumerRecord<*, *>>,
                consumer: Consumer<*, *>,
                container: MessageListenerContainer
            ) {
                val rootCause = generateSequence(thrownException as Throwable) { it.cause }
                    .lastOrNull() ?: thrownException
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
                super.handleRemaining(thrownException, records, consumer, container)
            }
        }
        return errorHandler.apply {
            addNotRetryableExceptions(
                IllegalArgumentException::class.java,
                JsonProcessingException::class.java
            )
            logger.info("Kafka ErrorHandler initialized with exponential backoff (1s → 2s → 4s, max 3 retries)")
            logger.info("Not retryable exceptions: IllegalArgumentException, JsonProcessingException")
        }
    }
}
