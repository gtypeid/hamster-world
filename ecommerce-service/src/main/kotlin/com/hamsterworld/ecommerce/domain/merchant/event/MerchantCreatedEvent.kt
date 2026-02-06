package com.hamsterworld.ecommerce.domain.merchant.event

import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import java.time.LocalDateTime

/**
 * Merchant 생성 완료 이벤트
 *
 * **발행 시점**: Merchant 생성 완료 (Merchant.onCreate())
 *
 * **구독자**:
 * - cash-gateway-service: PgMerchantMapping 생성
 * - 알림 서비스: 관리자에게 신규 판매자 신청 알림
 */
data class MerchantCreatedEvent(
    val merchantPublicId: String,  // Merchant의 Public ID (Snowflake Base62)
    val userPublicId: String,      // User의 Public ID (Snowflake Base62)
    val cashGatewayMid: String,    // Cash Gateway 발급 MID
    val storeName: String,
    val businessName: String,
    val businessNumber: String,
    val status: MerchantStatus,
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = AuditContextHolder.getContext()?.traceId,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = merchantPublicId
) {
    companion object {
        fun from(merchant: Merchant, userPublicId: String): MerchantCreatedEvent {
            return MerchantCreatedEvent(
                merchantPublicId = merchant.publicId,
                userPublicId = userPublicId,
                cashGatewayMid = merchant.cashGatewayMid,
                storeName = merchant.storeInfo.storeName,
                businessName = merchant.businessInfo.businessName,
                businessNumber = merchant.businessInfo.businessNumber,
                status = merchant.status
            )
        }
    }
}
