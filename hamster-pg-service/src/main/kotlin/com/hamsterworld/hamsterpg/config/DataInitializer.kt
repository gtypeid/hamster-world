package com.hamsterworld.hamsterpg.config

import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import com.hamsterworld.hamsterpg.domain.pgmid.repository.PgMidRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

@Component
class DataInitializer(
    private val pgMidRepository: PgMidRepository,
    @Value("\${payment.webhook.base-url}") private val webhookBaseUrl: String
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private const val DUMMY_MID_ID = "hamster_dummy_mid_001"
        private const val DUMMY_MERCHANT_NAME = "Hamster Cash Gateway"
        private const val WEBHOOK_PATH = "/api/webhook/pg/DUMMY"
    }

    override fun run(args: ApplicationArguments?) {
        val pgMid = PgMid.createWithMidId(
            midId = DUMMY_MID_ID,
            merchantName = DUMMY_MERCHANT_NAME,
            webhookUrl = "${webhookBaseUrl}${WEBHOOK_PATH}"
        )
        val saved = pgMidRepository.save(pgMid)

        log.info("[초기화] Dummy MID 생성 완료 - midId={}, webhookUrl={}, apiKey={}",
            saved.midId, saved.webhookUrl, saved.apiKey)
    }
}
