package com.hamsterworld.hamsterpg.app.pgmid.response

import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import java.time.LocalDateTime

data class MidResponse(
    val midId: String,
    val merchantName: String,
    val apiKey: String,
    val webhookUrl: String,
    val isActive: Boolean,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(pgMid: PgMid): MidResponse {
            return MidResponse(
                midId = pgMid.midId,
                merchantName = pgMid.merchantName,
                apiKey = pgMid.apiKey,
                webhookUrl = pgMid.webhookUrl,
                isActive = pgMid.isActive,
                createdAt = pgMid.createdAt,
                modifiedAt = pgMid.modifiedAt
            )
        }
    }
}
