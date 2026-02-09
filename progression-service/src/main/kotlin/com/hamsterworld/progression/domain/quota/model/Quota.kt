package com.hamsterworld.progression.domain.quota.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.constant.QuotaType
import com.hamsterworld.progression.domain.quota.event.InternalQuotaConsumedEvent
import com.hamsterworld.progression.domain.quota.event.InternalQuotaResetEvent
import com.hamsterworld.progression.domain.quota.event.QuotaClaimedEvent
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Quota (주기별 할당량 + 보상)
 *
 * ## 특징
 * - 주기마다 리셋되어 보상을 반복해서 받을 수 있음
 * - ACTION_REWARD: consumed >= maxLimit 시 보상 클레임
 * - ACTION_CONSTRAINT: consumed >= maxLimit 시 행동 불가
 *
 * ## 이벤트 발행 패턴: 리치 도메인
 * - `registerEvent()`를 사용하여 도메인 내에서 이벤트 등록
 * - Service는 repository.save()만 호출
 *
 * ## 발행 이벤트
 * - InternalQuotaConsumedEvent: 할당량 소비 (Internal)
 * - InternalQuotaResetEvent: 주기 리셋 (Internal)
 * - QuotaClaimedEvent: 보상 클레임 (Kafka → Payment Service)
 */
@Entity
@Table(
    name = "quotas",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_quota_user_key", columnNames = ["user_public_id", "quota_key"])
    ],
    indexes = [
        Index(name = "idx_quota_user", columnList = "user_public_id"),
        Index(name = "idx_quota_key", columnList = "quota_key"),
        Index(name = "idx_quota_cycle", columnList = "cycle_type")
    ]
)
class Quota(
    @Column(name = "user_public_id", nullable = false)
    val userPublicId: String,

    @Column(name = "quota_key", nullable = false)
    val quotaKey: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle_type", nullable = false)
    val cycleType: CycleType,

    @Enumerated(EnumType.STRING)
    @Column(name = "quota_type", nullable = false)
    val quotaType: QuotaType,

    @Column(name = "max_limit", nullable = false)
    val maxLimit: Int,

    @Column(name = "consumed", nullable = false)
    var consumed: Int = 0,

    @Column(name = "claimed", nullable = false)
    private var claimed: Boolean = false,

    @Column(name = "last_reset_at", nullable = false)
    var lastResetAt: LocalDateTime = LocalDateTime.now()
) : AbsDomain() {

    /**
     * 클레임 여부 조회
     */
    fun isClaimed(): Boolean = claimed

    /**
     * 소비 시도
     *
     * @param amount 소비량
     * @return 소비 성공 여부
     */
    fun consume(amount: Int = 1): Boolean {
        if (consumed >= maxLimit) {
            return false  // 이미 최대치 도달
        }

        val previousConsumed = consumed
        consumed = minOf(consumed + amount, maxLimit)
        val actualConsumed = consumed - previousConsumed

        if (actualConsumed == 0) {
            return false
        }

        val isCompleted = isCompleted()

        // 소비 이벤트 발행 (Internal)
        registerEvent(InternalQuotaConsumedEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            quotaKey = quotaKey,
            amount = actualConsumed,
            consumed = consumed,
            maxLimit = maxLimit,
            isCompleted = isCompleted
        ))

        return true
    }

    /**
     * 완료 여부 (maxLimit 도달)
     */
    fun isCompleted(): Boolean = consumed >= maxLimit

    /**
     * 클레임 가능 여부 (ACTION_REWARD만 해당)
     */
    fun canClaim(): Boolean {
        return quotaType == QuotaType.ACTION_REWARD && isCompleted() && !claimed
    }

    /**
     * 소비 가능 여부 (ACTION_CONSTRAINT 체크)
     */
    fun canConsume(amount: Int = 1): Boolean {
        return consumed + amount <= maxLimit
    }

    /**
     * 클레임
     */
    fun claim(quotaMaster: QuotaMaster) {
        if (!canClaim()) {
            throw IllegalStateException("Cannot claim: not completed or already claimed")
        }

        if (quotaType == QuotaType.ACTION_CONSTRAINT) {
            throw IllegalStateException("ACTION_CONSTRAINT quota cannot be claimed")
        }

        claimed = true

        // 클레임 이벤트 발행 → Payment Service로 (Kafka)
        registerEvent(QuotaClaimedEvent(
            userPublicId = userPublicId,
            quotaKey = quotaKey,
            rewardType = quotaMaster.rewardType!!.name,
            rewardAmount = quotaMaster.rewardAmount!!
        ))
    }

    /**
     * 리셋 (다음 주기)
     */
    fun reset() {
        consumed = 0
        claimed = false
        lastResetAt = LocalDateTime.now()

        // 리셋 이벤트 발행 (Internal)
        registerEvent(InternalQuotaResetEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            quotaKey = quotaKey,
            cycleType = cycleType.name
        ))
    }

    /**
     * 남은 양
     */
    fun remaining(): Int = maxLimit - consumed

    /**
     * 리셋 필요 여부 확인
     */
    fun needsReset(now: LocalDateTime): Boolean {
        return when (cycleType) {
            CycleType.DAILY -> now.toLocalDate().isAfter(lastResetAt.toLocalDate())
            CycleType.WEEKLY -> {
                // 월요일 기준
                val currentWeek = now.toLocalDate().let { it.toEpochDay() / 7 }
                val lastResetWeek = lastResetAt.toLocalDate().let { it.toEpochDay() / 7 }
                currentWeek > lastResetWeek
            }
            CycleType.MONTHLY -> {
                now.month != lastResetAt.month || now.year != lastResetAt.year
            }
            CycleType.NEVER -> false
        }
    }

    companion object {
        /**
         * Quota 생성 팩토리 메서드
         *
         * DDD 패턴: 도메인 생성 로직을 Domain 레이어에 위치
         *
         * @param userPublicId 유저 Public ID
         * @param quotaMaster Quota 마스터 데이터
         * @return 생성된 Quota
         */
        fun create(
            userPublicId: String,
            quotaMaster: QuotaMaster
        ): Quota {
            return Quota(
                userPublicId = userPublicId,
                quotaKey = quotaMaster.quotaKey,
                cycleType = quotaMaster.cycleType,
                quotaType = quotaMaster.quotaType,
                maxLimit = quotaMaster.maxLimit,
                consumed = 0,
                claimed = false
            )
        }
    }
}
