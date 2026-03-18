package com.hamsterworld.cashgateway.consumer.converter

import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.consumer.OrderStockReservedEventDto
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

/**
 * OrderStockReservedEventDto → PaymentApproveRequest 컨버터
 *
 * **용도**: Kafka 이벤트 → 결제 승인 요청 DTO 변환
 *
 * **변환 정책**:
 * - Provider: DUMMY (TODO: 정책 기반 Provider 선택)
 * - Cash Gateway MID: Cash Gateway가 userKeycloakId로 자체 조회 (Converter에서 지정하지 않음)
 *
 * **MID 정책**:
 * - 기존: application.yml의 payment.gateway.mid.default 설정값을 cashGatewayMid로 주입
 * - 변경: 외부 서비스가 MID를 지정하지 않음, userKeycloakId만 전달
 * - Cash Gateway의 PaymentService.approve()에서 userKeycloakId로 CashGatewayMid를 자체 조회
 */
@Component
class OrderStockReservedEventToPaymentApproveRequestConverter
    : DomainConverter<OrderStockReservedEventDto, PaymentApproveRequest> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == OrderStockReservedEventDto::class.java &&
                targetType == PaymentApproveRequest::class.java
    }

    override fun convert(source: OrderStockReservedEventDto): PaymentApproveRequest {
        // TODO: Provider 선택 정책 (금액별, 사용자별, 랜덤 등)
        val provider = Provider.DUMMY

        return PaymentApproveRequest(
            orderPublicId = source.orderPublicId,
            userKeycloakId = source.userKeycloakId,
            orderNumber = source.orderNumber,
            amount = source.cashAmount,
            provider = provider
        )
    }
}
