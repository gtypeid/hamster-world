package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentApprovedRequestWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

@Component
class PaymentApprovedRequestToProcessConverter(
    private val objectMapper: ObjectMapper
) : DomainConverter<PaymentApprovedRequestWithCtx, PaymentProcess> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == PaymentApprovedRequestWithCtx::class.java && targetType == PaymentProcess::class.java
    }

    override fun convert(source: PaymentApprovedRequestWithCtx): PaymentProcess {
        try {
            val provider = source.provider
            val ctx = source.paymentCtx
            val paymentRequest = source.paymentRequest

            val providerEnum = provider.getProvider()
            return PaymentProcess(
                orderPublicId = ctx.orderPublicId,
                userPublicId = ctx.userPublicId,
                orderNumber = ctx.orderNumber,
                provider = providerEnum,
                mid = ctx.mid,
                amount = ctx.amount,
                status = PaymentProcessStatus.UNKNOWN,
                gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, ctx.mid),
                activeRequestKey = "${ctx.userPublicId}-${ctx.orderPublicId}-${providerEnum}",
                requestPayload = objectMapper.writeValueAsString(paymentRequest)
            )
        } catch (e: Exception) {
            throw RuntimeException("결제 요청 -> PaymentProcess 변환 실패", e)
        }
    }
}
