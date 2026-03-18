package com.hamsterworld.progression.web.csv

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.mission.constant.MissionType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.seasonpromotion.constant.PromotionTargetRole
import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotionMaster
import jakarta.annotation.PostConstruct
import org.apache.commons.csv.CSVFormat
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.io.InputStreamReader
import java.time.LocalDateTime

@Component
class SeasonPromotionMasterLoader(
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    private val promotionMasterMap = mutableMapOf<String, SeasonPromotionMaster>()

    @PostConstruct
    fun loadPromotionMasters() {
        try {
            val promotionsResource = ClassPathResource("master/season_promotions.csv")
            val promotionsReader = InputStreamReader(promotionsResource.inputStream, Charsets.UTF_8)

            val promotionRecords = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build()
                .parse(promotionsReader)

            val tempPromotions = mutableMapOf<String, PromotionBasicInfo>()

            promotionRecords.forEach { record ->
                val promotionId = record.get("promotion_id")

                val condition = MissionCondition(
                    type = MissionType.valueOf(record.get("condition_type")),
                    requirement = record.get("requirement").toInt(),
                    filtersJson = record.get("condition_filters").takeIf { it.isNotBlank() && it != "{}" }
                )

                tempPromotions[promotionId] = PromotionBasicInfo(
                    promotionId = promotionId,
                    title = record.get("title"),
                    description = record.get("description"),
                    targetRole = PromotionTargetRole.valueOf(record.get("target_role")),
                    startAt = LocalDateTime.parse(record.get("start_at")),
                    endAt = LocalDateTime.parse(record.get("end_at")),
                    maxStep = record.get("max_step").toInt(),
                    condition = condition,
                    sortOrder = record.get("sort_order").toInt()
                )
            }

            val rewardsResource = ClassPathResource("master/season_promotion_rewards.csv")
            val rewardsReader = InputStreamReader(rewardsResource.inputStream, Charsets.UTF_8)

            val rewardRecords = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build()
                .parse(rewardsReader)

            val basicRewardsMap = mutableMapOf<String, MutableMap<Int, SeasonPromotionMaster.StepRewardEmitter>>()
            val vipBonusRewardsMap = mutableMapOf<String, MutableMap<Int, SeasonPromotionMaster.StepRewardEmitter>>()

            rewardRecords.forEach { record ->
                val promotionId = record.get("promotion_id")
                val step = record.get("step").toInt()
                val isVipBonus = record.get("is_vip_bonus").toBoolean()
                val rewardType = RewardType.valueOf(record.get("reward_type"))
                val rewardAmount = record.get("reward_amount").toInt()

                val stepReward = SeasonPromotionMaster.StepRewardEmitter(
                    rewardType = rewardType,
                    rewardAmount = rewardAmount
                )

                if (isVipBonus) {
                    vipBonusRewardsMap.getOrPut(promotionId) { mutableMapOf() }[step] = stepReward
                } else {
                    basicRewardsMap.getOrPut(promotionId) { mutableMapOf() }[step] = stepReward
                }
            }

            tempPromotions.forEach { (promotionId, basicInfo) ->
                val master = SeasonPromotionMaster(
                    promotionId = basicInfo.promotionId,
                    title = basicInfo.title,
                    description = basicInfo.description,
                    targetRole = basicInfo.targetRole,
                    startAt = basicInfo.startAt,
                    endAt = basicInfo.endAt,
                    maxStep = basicInfo.maxStep,
                    condition = basicInfo.condition,
                    basicRewards = basicRewardsMap[promotionId] ?: emptyMap(),
                    vipBonusRewards = vipBonusRewardsMap[promotionId] ?: emptyMap(),
                    sortOrder = basicInfo.sortOrder
                )

                promotionMasterMap[promotionId] = master
            }

            logger.info("✅ Loaded ${promotionMasterMap.size} Season Promotion Masters from CSV")
        } catch (e: Exception) {
            logger.error("❌ Failed to load Season Promotion Masters", e)
            throw e
        }
    }

    fun getPromotionMaster(promotionId: String): SeasonPromotionMaster? {
        return promotionMasterMap[promotionId]
    }

    fun getAllPromotionMasters(): List<SeasonPromotionMaster> {
        return promotionMasterMap.values.sortedBy { it.sortOrder }
    }

    private data class PromotionBasicInfo(
        val promotionId: String,
        val title: String,
        val description: String,
        val targetRole: PromotionTargetRole,
        val startAt: LocalDateTime,
        val endAt: LocalDateTime,
        val maxStep: Int,
        val condition: MissionCondition,
        val sortOrder: Int
    )
}
