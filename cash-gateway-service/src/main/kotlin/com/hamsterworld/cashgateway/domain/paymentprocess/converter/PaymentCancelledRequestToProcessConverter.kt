package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentCancelledRequestWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import com.hamsterworld.common.domain.converter.DomainConverter
import org.springframework.stereotype.Component

/**
 * CancelPaymentCtx → PaymentProcess 변환기
 *
 * ## 변경 사항
 * - 기존: ctx.payment (Payment 엔티티) 참조
 * - 변경: PaymentProcessRepository로 originProcess 조회
 * - 이유: Cash Gateway에서 Payment 제거, PaymentProcess만 관리
 */
@Component
class PaymentCancelledRequestToProcessConverter(
    private val objectMapper: ObjectMapper,
    private val paymentProcessRepository: PaymentProcessRepository
) : DomainConverter<PaymentCancelledRequestWithCtx, PaymentProcess> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == PaymentCancelledRequestWithCtx::class.java && targetType == PaymentProcess::class.java
    }

    override fun convert(source: PaymentCancelledRequestWithCtx): PaymentProcess {
        try {
            val provider = source.provider
            val ctx = source.paymentCtx as CancelPaymentCtx
            val paymentRequest = source.paymentRequest
            val providerEnum = provider.getProvider()

            // 원본 PaymentProcess 조회 (SUCCESS 상태)
            val originProcess = paymentProcessRepository.findByOrderPublicIdAndStatus(
                ctx.orderPublicId,
                PaymentProcessStatus.SUCCESS
            ) ?: throw RuntimeException(
                "원본 결제 프로세스를 찾을 수 없습니다. orderPublicId=${ctx.orderPublicId}"
            )

            return PaymentProcess(
                orderPublicId = ctx.orderPublicId,
                userKeycloakId = ctx.userKeycloakId,
                provider = providerEnum,
                cashGatewayMid = ctx.cashGatewayMid,
                // 취소는 음수 금액
                amount = ctx.amount.negate(),
                orderNumber = ctx.orderNumber,
                // 원본 PaymentProcess 참조
                originProcessId = originProcess.id,
                gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, ctx.cashGatewayMid),
                pgTransaction = null,  // 취소 요청 시점엔 아직 없음 (응답에서 받음)
                pgApprovalNo = null,    // 취소 요청 시점엔 아직 없음
                status = PaymentProcessStatus.UNKNOWN,
                activeRequestKey = "${ctx.userKeycloakId}-${ctx.orderPublicId}-${providerEnum}",
                requestPayload = objectMapper.writeValueAsString(paymentRequest)
            )
        } catch (e: Exception) {
            throw RuntimeException("취소 요청 -> PaymentProcess 변환 실패", e)
        }
    }
}
