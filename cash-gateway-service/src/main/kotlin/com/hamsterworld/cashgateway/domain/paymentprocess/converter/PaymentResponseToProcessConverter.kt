package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentResponseWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

@Component
class PaymentResponseToProcessConverter(
    private val objectMapper: ObjectMapper
) : DomainConverter<PaymentResponseWithCtx, PaymentProcess> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == PaymentResponseWithCtx::class.java && targetType == PaymentProcess::class.java
    }

    override fun convert(source: PaymentResponseWithCtx): PaymentProcess {
        try {
            val provider = source.provider
            val paymentResponse = source.paymentResponse
            val pgSuccess = provider.isSuccess(paymentResponse)

            val ctx = source.paymentCtx
            val originPayment = ctx.payment
            val ctxStatus = ctx.paymentStatus

            val status = if (ctxStatus == PaymentStatus.CANCELLED) {
                if (pgSuccess) PaymentProcessStatus.CANCELLED else PaymentProcessStatus.FAILED
            } else {
                if (pgSuccess) PaymentProcessStatus.SUCCESS else PaymentProcessStatus.FAILED
            }

            val providerEnum = provider.getProvider()
            var process = PaymentProcess(
                orderPublicId = ctx.orderPublicId,
                userPublicId = ctx.userPublicId,
                provider = providerEnum,
                mid = ctx.mid,
                amount = ctx.amount,
                orderNumber = ctx.orderNumber,
                status = status,
                gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, ctx.mid),
                code = paymentResponse.getCode(),
                message = paymentResponse.getMessage(),
                pgTransaction = paymentResponse.getPgTransaction(),
                pgApprovalNo = paymentResponse.getPgApprovalNo(),
                responsePayload = objectMapper.writeValueAsString(paymentResponse)
            )

            // 취소 플로우인 경우 originProcessId 세팅
            if (ctxStatus == PaymentStatus.CANCELLED && originPayment != null) {
               process.originProcessId = originPayment.processId
            }

            return process
        } catch (e: Exception) {
            throw RuntimeException("결제 응답 -> PaymentAttempt 변환 실패", e)
        }
    }
}
