package com.hamsterworld.hamsterpg.domain.pgmid.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.util.UUID

/**
 * PG 가맹점 (MID)
 *
 * PG사가 가맹점에게 발급하는 식별 정보.
 * - midId: 가맹점 고유 ID (거래 요청 시 이 가맹점이 요청했음을 식별)
 * - apiKey: HMAC 서명 검증용 시크릿
 * - webhookUrl: 거래 결과 노티를 보낼 콜백 URL (가맹점이 등록)
 */
@Entity
@Table(
    name = "pg_mids",
    indexes = [
        Index(name = "idx_pg_mids_public_id", columnList = "public_id", unique = true)
    ]
)
class PgMid private constructor(
    @Column(nullable = false, unique = true, length = 100)
    var midId: String,

    @Column(nullable = false, length = 200)
    var merchantName: String,

    @Column(nullable = false, unique = true, length = 100)
    var apiKey: String,

    @Column(name = "webhook_url", nullable = false, length = 500)
    var webhookUrl: String,

    @Column(nullable = false)
    var isActive: Boolean = true

) : AbsDomain() {

    companion object {
        fun create(merchantName: String, webhookUrl: String): PgMid {
            return PgMid(
                midId = "MID_${System.currentTimeMillis()}_${(1000..9999).random()}",
                merchantName = merchantName,
                apiKey = UUID.randomUUID().toString(),
                webhookUrl = webhookUrl,
                isActive = true
            )
        }

        /**
         * 고정 midId로 가맹점 생성 (시스템 초기화용)
         */
        fun createWithMidId(midId: String, merchantName: String, webhookUrl: String): PgMid {
            return PgMid(
                midId = midId,
                merchantName = merchantName,
                apiKey = UUID.randomUUID().toString(),
                webhookUrl = webhookUrl,
                isActive = true
            )
        }
    }

    fun deactivate(): PgMid {
        this.isActive = false
        return this
    }

    fun activate(): PgMid {
        this.isActive = true
        return this
    }
}
