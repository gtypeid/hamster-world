package com.hamsterworld.progression.domain.seasonpromotion.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.progression.domain.seasonpromotion.event.InternalSeasonPromotionStepAdvancedEvent
import com.hamsterworld.progression.domain.seasonpromotion.event.InternalSeasonPromotionVipActivatedEvent
import com.hamsterworld.progression.domain.seasonpromotion.event.SeasonPromotionRewardClaimedEvent
import jakarta.persistence.*

/**
 * Season Promotion (시즌 프로모션 유저 진행도)
 *
 * 유저별 시즌 프로모션 진행 상태 관리
 *
 * ## 특징
 * - Step 기반 진행 (0 → maxStep)
 * - 2-track 보상: 기본 + VIP 보너스
 * - VIP 상태는 Payment Service의 Ownership이 진실 (캐시)
 *
 * ## 이벤트 발행 패턴: 리치 도메인
 * - `registerEvent()`를 사용하여 도메인 내에서 이벤트 등록
 * - Service는 repository.save()만 호출
 *
 * ## 발행 이벤트
 * - InternalSeasonPromotionStepAdvancedEvent: 스텝 진행 (Internal)
 * - InternalSeasonPromotionVipActivatedEvent: VIP 활성화 (Internal)
 * - SeasonPromotionRewardClaimedEvent: 보상 클레임 (Kafka → Payment Service)
 */
@Entity
@Table(
    name = "season_promotions",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_season_promotion_user_promo", columnNames = ["user_public_id", "promotion_id"])
    ],
    indexes = [
        Index(name = "idx_season_promotion_user", columnList = "user_public_id"),
        Index(name = "idx_season_promotion_promo", columnList = "promotion_id"),
        Index(name = "idx_season_promotion_step", columnList = "current_step")
    ]
)
class SeasonPromotion(
    @Column(name = "user_public_id", nullable = false)
    val userPublicId: String,

    @Column(name = "promotion_id", nullable = false)
    val promotionId: String,

    @Column(name = "current_step", nullable = false)
    var currentStep: Int = 0,

    @Column(name = "is_vip", nullable = false)
    var isVip: Boolean = false,

    @ElementCollection
    @CollectionTable(
        name = "season_promotion_claimed_steps",
        joinColumns = [JoinColumn(name = "season_promotion_id")]
    )
    @Column(name = "step")
    var claimedSteps: MutableSet<Int> = mutableSetOf()
) : AbsDomain() {

    /**
     * 스텝 진행
     *
     * @param amount 진행량 (기본 1)
     * @param maxStep 최대 스텝
     * @return 실제 진행된 스텝 수
     */
    fun advanceStep(amount: Int = 1, maxStep: Int): Int {
        if (currentStep >= maxStep) {
            return 0  // 이미 최대 스텝 도달
        }

        val previousStep = currentStep
        currentStep = minOf(currentStep + amount, maxStep)
        val actualAdvanced = currentStep - previousStep

        if (actualAdvanced > 0) {
            // 스텝 진행 이벤트 발행 (Internal)
            registerEvent(InternalSeasonPromotionStepAdvancedEvent(
                aggregateId = this.publicId,
                userPublicId = userPublicId,
                promotionId = promotionId,
                previousStep = previousStep,
                currentStep = currentStep,
                advanced = actualAdvanced
            ))
        }

        return actualAdvanced
    }

    /**
     * VIP 활성화
     *
     * Payment Service의 Ownership 이벤트를 받아 호출됨
     */
    fun activateVip() {
        if (isVip) return  // 이미 VIP

        isVip = true

        // VIP 활성화 이벤트 발행 (Internal)
        registerEvent(InternalSeasonPromotionVipActivatedEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            promotionId = promotionId
        ))
    }

    /**
     * VIP 비활성화 (만료 시)
     */
    fun deactivateVip() {
        isVip = false
    }

    /**
     * 특정 스텝 클레임 가능 여부
     *
     * @param step 클레임할 스텝
     * @return 클레임 가능 여부
     */
    fun canClaimStep(step: Int): Boolean {
        return currentStep >= step && !claimedSteps.contains(step)
    }

    /**
     * 보상 클레임
     *
     * @param step 클레임할 스텝
     * @param master 프로모션 마스터 데이터
     */
    fun claimReward(step: Int, master: SeasonPromotionMaster) {
        if (!canClaimStep(step)) {
            throw IllegalStateException("Cannot claim step $step: already claimed or step not reached")
        }

        claimedSteps.add(step)

        // 기본 보상 클레임
        master.getBasicReward(step)?.let { reward ->
            registerEvent(SeasonPromotionRewardClaimedEvent(
                userPublicId = userPublicId,
                promotionId = promotionId,
                step = step,
                rewardType = reward.rewardType.name,
                rewardAmount = reward.rewardAmount,
                isVipBonus = false
            ))
        }

        // VIP 보너스 클레임 (VIP인 경우)
        if (isVip) {
            master.getVipBonus(step)?.let { reward ->
                registerEvent(SeasonPromotionRewardClaimedEvent(
                    userPublicId = userPublicId,
                    promotionId = promotionId,
                    step = step,
                    rewardType = reward.rewardType.name,
                    rewardAmount = reward.rewardAmount,
                    isVipBonus = true
                ))
            }
        }
    }

    /**
     * 진행률 (0.0 ~ 1.0)
     */
    fun getProgressRate(maxStep: Int): Double {
        if (maxStep == 0) return 1.0
        return currentStep.toDouble() / maxStep
    }

    /**
     * 스텝이 클레임되었는지 확인
     */
    fun isStepClaimed(step: Int): Boolean {
        return claimedSteps.contains(step)
    }

    companion object {
        /**
         * SeasonPromotion 생성 팩토리 메서드
         *
         * DDD 패턴: 도메인 생성 로직을 Domain 레이어에 위치
         *
         * @param userPublicId 유저 Public ID
         * @param promotionId 프로모션 ID
         * @return 생성된 SeasonPromotion
         */
        fun create(
            userPublicId: String,
            promotionId: String
        ): SeasonPromotion {
            return SeasonPromotion(
                userPublicId = userPublicId,
                promotionId = promotionId,
                currentStep = 0,
                isVip = false,
                claimedSteps = mutableSetOf()
            )
        }
    }
}
