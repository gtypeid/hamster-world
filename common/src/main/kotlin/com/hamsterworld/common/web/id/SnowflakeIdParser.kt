package com.hamsterworld.common.web.id

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

/**
 * Snowflake ID Parser
 * String ID를 디코딩하여 정보 추출
 */
object SnowflakeIdParser {

    // 2024-01-01 00:00:00 UTC (기준 시간)
    private const val EPOCH = 1704067200000L

    private const val TIMESTAMP_SHIFT = 22
    private const val REGION_SHIFT = 17
    private const val SERVICE_SHIFT = 12
    private const val INSTANCE_SHIFT = 7

    private const val TIMESTAMP_MASK = 0x1FFFFFFFFFFL
    private const val REGION_MASK = 0x1FL
    private const val SERVICE_MASK = 0x1FL
    private const val INSTANCE_MASK = 0x1FL
    private const val SEQUENCE_MASK = 0x7FL

    /**
     * String ID를 파싱하여 정보 추출
     */
    @JvmStatic
    fun parse(publicId: String): SnowflakeIdInfo {
        val id = SnowflakeIdEncoder.decode(publicId)
        return parse(id)
    }

    /**
     * Long ID를 파싱하여 정보 추출
     */
    @JvmStatic
    fun parse(id: Long): SnowflakeIdInfo {
        val timestamp = ((id shr TIMESTAMP_SHIFT) and TIMESTAMP_MASK) + EPOCH
        val region = (id shr REGION_SHIFT) and REGION_MASK
        val service = (id shr SERVICE_SHIFT) and SERVICE_MASK
        val instance = (id shr INSTANCE_SHIFT) and INSTANCE_MASK
        val sequence = id and SEQUENCE_MASK

        return SnowflakeIdInfo(
            originalId = id,
            publicId = SnowflakeIdEncoder.encode(id),
            timestamp = LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneOffset.UTC),
            regionId = region.toInt(),
            regionName = getRegionName(region.toInt()),
            serviceId = service.toInt(),
            serviceName = getServiceName(service.toInt()),
            instanceId = instance.toInt(),
            sequence = sequence.toInt()
        )
    }

    private fun getRegionName(regionId: Int): String {
        return when (regionId) {
            1 -> "asia-seoul"
            2 -> "asia-tokyo"
            3 -> "us-east"
            4 -> "us-west"
            5 -> "eu-central"
            else -> "unknown"
        }
    }

    private fun getServiceName(serviceId: Int): String {
        return when (serviceId) {
            1 -> "ecommerce"
            2 -> "payment"
            3 -> "cash-gateway"
            4 -> "hamster-pg"
            else -> "unknown"
        }
    }
}
