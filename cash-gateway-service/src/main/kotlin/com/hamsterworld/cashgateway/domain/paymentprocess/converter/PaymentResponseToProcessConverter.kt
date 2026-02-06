package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentResponseWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

/**
 * PaymentResponse → PaymentProcess 변환기
 *
 * ## 주의사항
 * - 현재는 Webhook 전용 정책으로 이 converter는 사용되지 않음
 * - 동기 응답 처리는 단순히 UNKNOWN 상태 유지만 함
 * - 실제 SUCCESS/FAILED 전환은 Webhook에서 처리
 *
 * ## 변경 사항
 * - 기존: ctx.payment (Payment 엔티티) 참조
 * - 변경: Payment 제거
 * - 이유: originProcessId는 PaymentCancelledRequestToProcessConverter에서 이미 설정됨
 */
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
            val ctxStatus = ctx.paymentStatus

            val status = if (ctxStatus == PaymentStatus.CANCELLED) {
                if (pgSuccess) PaymentProcessStatus.CANCELLED else PaymentProcessStatus.FAILED
            } else {
                if (pgSuccess) PaymentProcessStatus.SUCCESS else PaymentProcessStatus.FAILED
            }

            val providerEnum = provider.getProvider()
            val process = PaymentProcess(
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
                // originProcessId는 PaymentCancelledRequestToProcessConverter에서 이미 설정됨
            )

            return process
        } catch (e: Exception) {
            throw RuntimeException("결제 응답 -> PaymentProcess 변환 실패", e)
        }
    }
}
