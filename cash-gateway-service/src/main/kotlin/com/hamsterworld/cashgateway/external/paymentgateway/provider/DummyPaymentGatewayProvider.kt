package com.hamsterworld.cashgateway.external.paymentgateway.provider

import com.fasterxml.jackson.annotation.JsonProperty
import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCancelRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse
import com.hamsterworld.cashgateway.external.paymentgateway.dto.dummy.DummyAcknowledgementResponse
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Component
import java.math.BigDecimal

@Component
class DummyPaymentGatewayProvider(
    private val objectMapper: ObjectMapper
) : PaymentGatewayProvider {

    companion object {
        private const val ENDPOINT = "http://localhost:8083/api/payment-process"
        private const val SUCCESS_CODE = "0000"
        private const val MID = "hamster_dummy_mid_001"  // Dummy PG MID
    }

    override fun getProvider(): Provider = Provider.DUMMY

    override fun getEndpoint(): String = ENDPOINT

    override fun getMid(): String = MID

    override fun prepareRequest(paymentCtx: PaymentCtx): PaymentRequest {
        return if (paymentCtx.paymentStatus == PaymentStatus.APPROVED) {
            DummyPaymentRequest(
                userPublicId = paymentCtx.userPublicId,
                orderId = paymentCtx.orderNumber,
                amount = paymentCtx.amount,
                echo = mapOf(
                    "mid" to paymentCtx.mid,
                    "orderNumber" to paymentCtx.orderNumber
                    // gatewayReferenceId는 PaymentProcess 생성 시 자동 생성되므로 여기서는 포함하지 않음
                    // 폴링 서비스에서 별도로 echo에 추가할 예정
                )
            )
        } else {
            val cancelCtx = paymentCtx as CancelPaymentCtx
            DummyPaymentCancelRequest(
                userPublicId = paymentCtx.userPublicId,
                orderId = paymentCtx.orderNumber,
                amount = paymentCtx.amount,
                tid = cancelCtx.originTid,
                cancel = "CANCEL",
                echo = mapOf(
                    "mid" to paymentCtx.mid,
                    "orderNumber" to paymentCtx.orderNumber
                )
            )
        }
    }

    override fun parsePaymentResponse(payload: String): PaymentResponse {
        return try {
            objectMapper.readValue(payload, DummyPaymentResponse::class.java)
        } catch (e: JsonProcessingException) {
            throw CustomRuntimeException("Dummy PG 응답 파싱 실패", e)
        }
    }

    override fun isSuccess(response: PaymentResponse): Boolean {
        if (response !is DummyPaymentResponse) return false
        return SUCCESS_CODE == response.getCode()
    }

    /**
     * Dummy PG는 비동기 방식
     * - 200 OK = 요청 접수 (승인 아님)
     * - 실제 승인/실패는 Webhook으로 수신
     */
    override fun isSynchronousApproval(): Boolean = false

    /**
     * Webhook/PG 응답에서 MID 추출
     *
     * DummyPaymentResponse의 echo 필드에서 MID를 추출
     * echo에 없으면 기본 MID 반환
     */
    override fun extractMid(response: PaymentResponse): String? {
        if (response !is DummyPaymentResponse) return null

        // echo에서 MID 추출 시도
        return response.echo["mid"] as? String
            ?: MID  // echo에 없으면 기본 MID 반환
    }


    /**
     * Dummy PG 승인(Acknowledgement) 응답 파싱
     *
     * 초기 요청 응답 처리:
     * - 202 Accepted + status=PENDING: 비동기 처리
     * - 200 OK + status=SUCCESS: 동기 즉시 승인
     * - 200 OK + status=FAILED: 동기 즉시 실패
     *
     * @param payload JSON 응답 문자열
     * @param httpStatusCode HTTP 상태 코드
     * @return 파싱된 DummyAcknowledgementResponse
     */
    override fun parseAcknowledgementResponse(payload: String, httpStatusCode: String): AcknowledgementResponse {
        return try {
            val response = objectMapper.readValue(payload, DummyAcknowledgementResponse::class.java)
            response.httpStatusCode = httpStatusCode
            response
        } catch (e: JsonProcessingException) {
            // 파싱 실패 시 기본 응답 생성
            DummyAcknowledgementResponse(
                status = "ERROR",
                code = "PARSE_ERROR",
                message = "Failed to parse PG response: ${e.message}",
                httpStatusCode = httpStatusCode
            )
        }
    }

    data class DummyPaymentRequest(
        val userPublicId: String?,  // E-commerce Service의 User Public ID (Snowflake Base62)
        val orderId: String,
        private val amount: BigDecimal,
        val echo: Map<String, Any?> = emptyMap()  // orderNumber, mid 포함
    ) : PaymentRequest {
        // PaymentRequest 규약 일단 강제 오버라이드
        override fun getAmount(): BigDecimal = amount

        override fun getRequestType(): PaymentStatus = PaymentStatus.APPROVED
    }

    data class DummyPaymentCancelRequest(
        val userPublicId: String?,  // E-commerce Service의 User Public ID (Snowflake Base62)
        val orderId: String,
        private val amount: BigDecimal,
        val tid: String,
        private val cancel: String,
        val echo: Map<String, Any?> = emptyMap()  // orderNumber, mid 포함
    ) : PaymentCancelRequest {
        override fun getAmount(): BigDecimal = amount

        override fun getPgTransaction(): String = tid

        override fun getCancel(): String = cancel

        override fun getRequestType(): PaymentStatus = PaymentStatus.CANCELLED
    }

    data class DummyPaymentResponse(

        @JsonProperty("status")
        val status: String = "",

        @JsonProperty("code")
        private val codeValue: String = "",

        @JsonProperty("transactionId")
        private val transactionIdValue: String? = null,

        @JsonProperty("approvalNo")
        private val approvalNoValue: String? = null,

        @JsonProperty("amount")
        private val amountValue: BigDecimal? = null,

        @JsonProperty("echo")
        val echo: Map<String, Any?> = emptyMap(),

        @JsonProperty("message")
        private val messageValue: String = ""

    ) : PaymentResponse {

        override fun getCode(): String = codeValue

        override fun getMessage(): String = messageValue

        override fun getPgTransaction(): String? = transactionIdValue

        override fun getPgApprovalNo(): String? = approvalNoValue

        override fun getAmount(): BigDecimal? = amountValue

        override fun isSuccess(): Boolean = codeValue == "0000"
    }
}
