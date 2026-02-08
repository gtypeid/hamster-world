package com.hamsterworld.progression.web.csv

import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.constant.MissionConditionEmitter
import com.hamsterworld.progression.domain.mission.constant.MissionType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.constant.QuotaType
import com.hamsterworld.progression.domain.quota.model.QuotaMaster
import jakarta.annotation.PostConstruct
import org.apache.commons.csv.CSVFormat
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.io.InputStreamReader

/**
 * Quota Master CSV Loader
 *
 * @PostConstruct로 앱 시작 시 CSV 로딩
 */
@Component
class QuotaMasterLoader {

    private val logger = LoggerFactory.getLogger(javaClass)

    // 인메모리 저장
    private val quotaMasterMap = mutableMapOf<String, QuotaMaster>()

    @PostConstruct
    fun loadQuotaMasters() {
        try {
            val resource = ClassPathResource("master/quotas.csv")
            val reader = InputStreamReader(resource.inputStream, Charsets.UTF_8)

            val records = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build()
                .parse(reader)

            records.forEach { record ->
                val quotaId = record.get("quota_id")
                val quotaType = QuotaType.valueOf(record.get("quota_type"))

                // MissionCondition 생성 (항상 필요)
                val condition = MissionCondition(
                    type = MissionType.valueOf(record.get("condition_type")),
                    requirement = record.get("requirement").toInt(),
                    filtersJson = record.get("condition_filters").takeIf { it.isNotBlank() && it != "{}" }
                )

                val quotaMaster = QuotaMaster(
                    quotaId = quotaId,
                    quotaKey = record.get("quota_key"),
                    name = record.get("name"),
                    description = record.get("description"),
                    cycleType = CycleType.valueOf(record.get("cycle_type")),
                    quotaType = quotaType,
                    maxLimit = record.get("max_limit").toInt(),
                    condition = condition,
                    emitter = if (quotaType == QuotaType.ACTION_REWARD) {
                        MissionConditionEmitter(
                            rewardType = RewardType.valueOf(record.get("reward_type")),
                            rewardAmount = record.get("reward_amount").toInt()
                        )
                    } else null,
                    sortOrder = record.get("sort_order").toInt()
                )

                quotaMasterMap[quotaId] = quotaMaster
            }

            logger.info("✅ Loaded ${quotaMasterMap.size} Quota Masters from CSV")
        } catch (e: Exception) {
            logger.error("❌ Failed to load Quota Masters", e)
            throw e
        }
    }

    /**
     * Quota Master 조회
     */
    fun getQuotaMaster(quotaKey: String): QuotaMaster? {
        return quotaMasterMap.values.find { it.quotaKey == quotaKey }
    }

    /**
     * 전체 Quota Master 조회
     */
    fun getAllQuotaMasters(): List<QuotaMaster> {
        return quotaMasterMap.values.sortedBy { it.sortOrder }
    }
}
