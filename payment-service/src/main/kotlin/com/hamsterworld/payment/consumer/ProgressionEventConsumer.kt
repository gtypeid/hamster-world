package com.hamsterworld.payment.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.service.AccountService
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Component
class ProgressionEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val accountService: AccountService
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, KafkaTopics.PROGRESSION_EVENTS) {

    @KafkaListener(
        topics = [KafkaTopics.PROGRESSION_EVENTS],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "ArchiveClaimedEvent" -> handleArchiveClaimed(parsedEvent)
            "QuotaClaimedEvent" -> handleQuotaClaimed(parsedEvent)
            "SeasonPromotionRewardClaimedEvent" -> handleSeasonPromotionRewardClaimed(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    private fun handleArchiveClaimed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<ArchiveClaimedEventDto>(parsedEvent.payload)

        if (event.rewardType != "POINT") {
            logger.info("Archive 보상 스킵 (미지원 타입) | rewardType={} | eventId={}", event.rewardType, parsedEvent.eventId)
            return
        }

        accountService.updateBalanceFromEvent(
            userPublicId = event.userPublicId,
            accountType = AccountType.CONSUMER,
            delta = BigDecimal(event.rewardAmount),
            reason = "Archive 보상 (archiveId=${event.archiveId})"
        )

        logger.info(
            "Archive 포인트 적립 완료 | userPublicId={} | amount={} | archiveId={} | eventId={}",
            event.userPublicId, event.rewardAmount, event.archiveId, parsedEvent.eventId
        )
    }

    private fun handleQuotaClaimed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<QuotaClaimedEventDto>(parsedEvent.payload)

        if (event.rewardType != "POINT") {
            logger.info("Quota 보상 스킵 (미지원 타입) | rewardType={} | eventId={}", event.rewardType, parsedEvent.eventId)
            return
        }

        accountService.updateBalanceFromEvent(
            userPublicId = event.userPublicId,
            accountType = AccountType.CONSUMER,
            delta = BigDecimal(event.rewardAmount),
            reason = "Quota 보상 (quotaKey=${event.quotaKey})"
        )

        logger.info(
            "Quota 포인트 적립 완료 | userPublicId={} | amount={} | quotaKey={} | eventId={}",
            event.userPublicId, event.rewardAmount, event.quotaKey, parsedEvent.eventId
        )
    }

    private fun handleSeasonPromotionRewardClaimed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<SeasonPromotionRewardClaimedEventDto>(parsedEvent.payload)

        if (event.rewardType != "POINT") {
            logger.info("SeasonPromotion 보상 스킵 (미지원 타입) | rewardType={} | eventId={}", event.rewardType, parsedEvent.eventId)
            return
        }

        val bonusLabel = if (event.isVipBonus) "VIP 보너스" else "기본 보상"
        accountService.updateBalanceFromEvent(
            userPublicId = event.userPublicId,
            accountType = AccountType.CONSUMER,
            delta = BigDecimal(event.rewardAmount),
            reason = "SeasonPromotion $bonusLabel (promotionId=${event.promotionId}, step=${event.step})"
        )

        logger.info(
            "SeasonPromotion 포인트 적립 완료 | userPublicId={} | amount={} | promotionId={} | step={} | vip={} | eventId={}",
            event.userPublicId, event.rewardAmount, event.promotionId, event.step, event.isVipBonus, parsedEvent.eventId
        )
    }
}

private data class ArchiveClaimedEventDto(
    val userPublicId: String,
    val archiveId: String,
    val rewardType: String,
    val rewardAmount: Int
)

private data class QuotaClaimedEventDto(
    val userPublicId: String,
    val quotaKey: String,
    val rewardType: String,
    val rewardAmount: Int
)

private data class SeasonPromotionRewardClaimedEventDto(
    val userPublicId: String,
    val promotionId: String,
    val step: Int,
    val rewardType: String,
    val rewardAmount: Int,
    val isVipBonus: Boolean
)
