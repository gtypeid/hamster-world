package com.hamsterworld.cashgateway.consumer.converter

import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.consumer.OrderStockReservedEventDto
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

/**
 * OrderStockReservedEventDto → PaymentApproveRequest 컨버터
 *
 * **용도**: Kafka 이벤트 → HTTP Request DTO 변환
 *
 * **변환 정책**:
 * - Provider: DUMMY (TODO: 정책 기반 Provider 선택)
 * - cashGatewayMid: Provider별 기본 MID (TODO: 설정 파일 또는 DB 조회)
 */
@Component
class OrderStockReservedEventToPaymentApproveRequestConverter : DomainConverter<OrderStockReservedEventDto, PaymentApproveRequest> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == OrderStockReservedEventDto::class.java &&
                targetType == PaymentApproveRequest::class.java
    }

    override fun convert(source: OrderStockReservedEventDto): PaymentApproveRequest {
        // TODO: Provider 선택 정책 (금액별, 사용자별, 랜덤 등)
        val provider = Provider.DUMMY

        // TODO: Provider별 기본 MID 조회 (설정 파일 또는 DB)
        val cashGatewayMid = "CGW_MID_001"

        return PaymentApproveRequest(
            orderPublicId = source.orderPublicId,
            userPublicId = source.userPublicId,
            orderNumber = source.orderNumber,
            amount = source.cashAmount,
            provider = provider,
            cashGatewayMid = cashGatewayMid
        )
    }
}
