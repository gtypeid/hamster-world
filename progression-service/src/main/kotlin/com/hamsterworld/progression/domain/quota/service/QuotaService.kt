package com.hamsterworld.progression.domain.quota.service

import com.hamsterworld.progression.app.quota.response.UserQuotaDto
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.dto.QuotaSearchRequest
import com.hamsterworld.progression.domain.quota.model.Quota
import com.hamsterworld.progression.domain.quota.model.QuotaMaster
import com.hamsterworld.progression.domain.quota.repository.QuotaRepository
import com.hamsterworld.progression.web.csv.QuotaMasterLoader
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Quota Service
 * 할당량 시스템 비즈니스 로직 처리
 *
 * ## 조회 패턴
 * - 모든 조회는 search 메서드 사용 (통합)
 * - 특정 유저: searchListDto(QuotaSearchRequest(userPublicId = "xxx"))
 * - 특정 Quota: searchListDto(QuotaSearchRequest(userPublicId = "xxx", quotaKey = "yyy")).firstOrNull()
 */
@Service
class QuotaService(
    private val quotaRepository: QuotaRepository,
    private val quotaMasterLoader: QuotaMasterLoader
) {

    // ==================== Public API ====================

    /**
     * Quota 검색 (List DTO)
     */
    @Transactional(readOnly = true)
    fun searchListDto(search: QuotaSearchRequest): List<UserQuotaDto> {
        val quotas = quotaRepository.findAll(search)
        val allQuotaMasters = quotaMasterLoader.getAllQuotaMasters()
        val quotaMasterMap = allQuotaMasters.associateBy { it.quotaKey }

        return quotas.map { quota ->
            val quotaMaster = quotaMasterMap[quota.quotaKey]
                ?: throw IllegalStateException("Quota master not found: ${quota.quotaKey}")
            UserQuotaDto.from(quotaMaster, quota)
        }
    }

    /**
     * Quota 검색 (Page DTO)
     */
    @Transactional(readOnly = true)
    fun searchPageDto(search: QuotaSearchRequest): Page<UserQuotaDto> {
        val quotasPage = quotaRepository.findAllPage(search)
        val allQuotaMasters = quotaMasterLoader.getAllQuotaMasters()
        val quotaMasterMap = allQuotaMasters.associateBy { it.quotaKey }

        val content = quotasPage.content.map { quota ->
            val quotaMaster = quotaMasterMap[quota.quotaKey]
                ?: throw IllegalStateException("Quota master not found: ${quota.quotaKey}")
            UserQuotaDto.from(quotaMaster, quota)
        }

        return PageImpl(
            content,
            quotasPage.pageable,
            quotasPage.totalElements
        )
    }

    /**
     * Quota 보상 클레임
     */
    @Transactional
    fun claimReward(
        userPublicId: String,
        quotaKey: String
    ): Quota {
        val quotaMaster = quotaMasterLoader.getQuotaMaster(quotaKey)
            ?: throw IllegalArgumentException("Quota not found: $quotaKey")

        val quota = quotaRepository.findByUserPublicIdAndQuotaKey(userPublicId, quotaKey)
            ?: throw IllegalArgumentException("Quota not found for user: $userPublicId, quota: $quotaKey")

        quota.claim(quotaMaster)
        return quotaRepository.save(quota)
    }

    // ==================== Internal/Consumer용 ====================

    /**
     * Quota 소비 (Consumer 전용)
     */
    @Transactional
    fun consumeQuota(
        userPublicId: String,
        quotaMaster: QuotaMaster,
        amount: Int = 1
    ): Quota {
        val quota = getOrCreateQuota(userPublicId, quotaMaster)

        if (!quota.consume(amount)) {
            throw IllegalStateException("Cannot consume quota: limit reached")
        }

        return quotaRepository.save(quota)
    }

    // ==================== Batch/Scheduler용 ====================

    /**
     * 주기별 전체 리셋 (배치 작업용)
     */
    @Transactional
    fun resetQuotasByCycle(cycleType: CycleType) {
        val quotas = quotaRepository.findByCycleType(cycleType)
        val now = LocalDateTime.now()

        quotas.forEach { quota ->
            if (quota.needsReset(now)) {
                quota.reset()
                quotaRepository.save(quota)
            }
        }
    }

    // ==================== Private Helpers ====================

    private fun getOrCreateQuota(userPublicId: String, quotaMaster: QuotaMaster): Quota {
        val existing = quotaRepository.findByUserPublicIdAndQuotaKey(userPublicId, quotaMaster.quotaKey)

        if (existing != null) {
            if (existing.needsReset(LocalDateTime.now())) {
                existing.reset()
                return quotaRepository.save(existing)
            }
            return existing
        }

        // DDD 팩토리 메서드 사용
        val quota = Quota.create(
            userPublicId = userPublicId,
            quotaMaster = quotaMaster
        )
        return quotaRepository.save(quota)
    }
}
