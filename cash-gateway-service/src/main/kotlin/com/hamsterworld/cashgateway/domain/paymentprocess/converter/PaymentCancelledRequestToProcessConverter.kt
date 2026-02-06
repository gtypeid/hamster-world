package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentCancelledRequestWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

@Component
class PaymentCancelledRequestToProcessConverter(
    private val objectMapper: ObjectMapper
) : DomainConverter<PaymentCancelledRequestWithCtx, PaymentProcess> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == PaymentCancelledRequestWithCtx::class.java && targetType == PaymentProcess::class.java
    }

    override fun convert(source: PaymentCancelledRequestWithCtx): PaymentProcess {
        try {
            val provider = source.provider
            val ctx = source.paymentCtx
            val paymentRequest = source.paymentRequest

            // 원 결제 정보 (CancelPaymentCtx는 payment가 반드시 존재)
            val approvedPayment = ctx.payment!!
            val providerEnum = provider.getProvider()

            return PaymentProcess(
                orderPublicId = approvedPayment.orderPublicId,
                userPublicId = approvedPayment.userPublicId,
                provider = providerEnum,
                mid = approvedPayment.mid,
                // 음수
                amount = approvedPayment.amount.negate(),
                orderNumber = ctx.orderNumber,  // PaymentCtx에서 가져옴
                // 원 결제 정보
                originProcessId = approvedPayment.processId,
                gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, approvedPayment.mid),
                pgTransaction = approvedPayment.pgTransaction,
                pgApprovalNo = approvedPayment.pgApprovalNo,
                status = PaymentProcessStatus.UNKNOWN,
                activeRequestKey = "${approvedPayment.userPublicId}-${approvedPayment.orderPublicId}-${providerEnum}",
                requestPayload = objectMapper.writeValueAsString(paymentRequest)
            )
        } catch (e: Exception) {
            throw RuntimeException("원 결제 기반 -> 취소 PaymentAttempt 변환 실패", e)
        }
    }
}
