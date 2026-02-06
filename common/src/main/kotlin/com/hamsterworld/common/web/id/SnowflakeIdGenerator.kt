package com.hamsterworld.common.web.id

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.concurrent.atomic.AtomicLong

/**
 * Snowflake ID Generator
 * 64-bit 분산 고유 ID 생성기
 *
 * 구조 (64 bits):
 * - 1 bit: 부호 비트 (항상 0)
 * - 41 bits: 타임스탬프 (밀리초, ~69년)
 * - 5 bits: 리전 ID (0-31)
 * - 5 bits: 서비스 ID (0-31)
 * - 5 bits: 인스턴스 ID (0-31)
 * - 7 bits: 시퀀스 번호 (0-127)
 */
@Component
class SnowflakeIdGenerator(
    @Value("\${snowflake.region-id:0}") private val regionId: Long = 0,
    @Value("\${snowflake.service-id:0}") private val serviceId: Long = 0,
    @Value("\${snowflake.instance-id:0}") private val instanceId: Long = 0
) {
    companion object {
        // 2024-01-01 00:00:00 UTC (기준 시간)
        private const val EPOCH = 1704067200000L

        // Bit lengths
        private const val TIMESTAMP_BITS = 41
        private const val REGION_BITS = 5
        private const val SERVICE_BITS = 5
        private const val INSTANCE_BITS = 5
        private const val SEQUENCE_BITS = 7

        // Bit shifts
        private const val TIMESTAMP_SHIFT = REGION_BITS + SERVICE_BITS + INSTANCE_BITS + SEQUENCE_BITS
        private const val REGION_SHIFT = SERVICE_BITS + INSTANCE_BITS + SEQUENCE_BITS
        private const val SERVICE_SHIFT = INSTANCE_BITS + SEQUENCE_BITS
        private const val INSTANCE_SHIFT = SEQUENCE_BITS

        // Max values
        private const val MAX_REGION_ID = (1L shl REGION_BITS) - 1
        private const val MAX_SERVICE_ID = (1L shl SERVICE_BITS) - 1
        private const val MAX_INSTANCE_ID = (1L shl INSTANCE_BITS) - 1
        private const val MAX_SEQUENCE = (1L shl SEQUENCE_BITS) - 1
    }

    private val sequence = AtomicLong(0)
    private var lastTimestamp = -1L

    init {
        require(regionId in 0..MAX_REGION_ID) {
            "Region ID must be between 0 and $MAX_REGION_ID"
        }
        require(serviceId in 0..MAX_SERVICE_ID) {
            "Service ID must be between 0 and $MAX_SERVICE_ID"
        }
        require(instanceId in 0..MAX_INSTANCE_ID) {
            "Instance ID must be between 0 and $MAX_INSTANCE_ID"
        }
    }

    /**
     * ID 생성
     */
    @Synchronized
    fun nextId(): Long {
        var timestamp = currentTimeMillis()

        if (timestamp < lastTimestamp) {
            throw IllegalStateException("Clock moved backwards. Refusing to generate id")
        }

        if (timestamp == lastTimestamp) {
            val seq = sequence.incrementAndGet() and MAX_SEQUENCE
            if (seq == 0L) {
                // Sequence overflow, wait for next millisecond
                timestamp = waitNextMillis(lastTimestamp)
            }
        } else {
            sequence.set(0)
        }

        lastTimestamp = timestamp

        return ((timestamp - EPOCH) shl TIMESTAMP_SHIFT) or
               (regionId shl REGION_SHIFT) or
               (serviceId shl SERVICE_SHIFT) or
               (instanceId shl INSTANCE_SHIFT) or
               sequence.get()
    }

    /**
     * String ID 직접 생성 (Base62 인코딩)
     * 주요 메서드 - DB에 String으로 저장
     */
    fun nextIdString(): String {
        return SnowflakeIdEncoder.encode(nextId())
    }

    /**
     * ID에서 정보 추출
     */
    fun parseId(id: Long): SnowflakeIdInfo {
        val timestamp = ((id shr TIMESTAMP_SHIFT) and ((1L shl TIMESTAMP_BITS) - 1)) + EPOCH
        val region = (id shr REGION_SHIFT) and MAX_REGION_ID
        val service = (id shr SERVICE_SHIFT) and MAX_SERVICE_ID
        val instance = (id shr INSTANCE_SHIFT) and MAX_INSTANCE_ID
        val seq = id and MAX_SEQUENCE

        return SnowflakeIdInfo(
            id = id,
            timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneOffset.UTC),
            regionId = region.toInt(),
            serviceId = service.toInt(),
            instanceId = instance.toInt(),
            sequence = seq.toInt()
        )
    }

    private fun currentTimeMillis(): Long = System.currentTimeMillis()

    private fun waitNextMillis(lastTimestamp: Long): Long {
        var timestamp = currentTimeMillis()
        while (timestamp <= lastTimestamp) {
            timestamp = currentTimeMillis()
        }
        return timestamp
    }
}

/**
 * Snowflake ID 상세 정보
 */
data class SnowflakeIdInfo(
    val originalId: Long,
    val publicId: String,
    val timestamp: LocalDateTime,
    val regionId: Int,
    val regionName: String,
    val serviceId: Int,
    val serviceName: String,
    val instanceId: Int,
    val sequence: Int
) {
    /**
     * Deprecated constructor for backward compatibility
     */
    @Deprecated("Use full constructor with regionName and serviceName")
    constructor(
        id: Long,
        timestamp: LocalDateTime,
        regionId: Int,
        serviceId: Int,
        instanceId: Int,
        sequence: Int
    ) : this(
        originalId = id,
        publicId = SnowflakeIdEncoder.encode(id),
        timestamp = timestamp,
        regionId = regionId,
        regionName = "unknown",
        serviceId = serviceId,
        serviceName = "unknown",
        instanceId = instanceId,
        sequence = sequence
    )
}
