package com.hamsterworld.ecommerce.domain.merchant.event
import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import java.time.LocalDateTime
data class MerchantCreatedEvent(
    val merchantPublicId: String,
    val userPublicId: String,
    val cashGatewayMid: String,
    val storeName: String,
    val businessName: String,
    val businessNumber: String,
    val status: MerchantStatus,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = merchantPublicId,
    aggregateType = "Merchant",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
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
