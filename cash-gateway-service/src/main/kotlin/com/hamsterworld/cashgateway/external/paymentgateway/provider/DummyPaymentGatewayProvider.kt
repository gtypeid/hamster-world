package com.hamsterworld.cashgateway.external.paymentgateway.provider

import com.fasterxml.jackson.annotation.JsonIgnore
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
import com.hamsterworld.cashgateway.domain.cashgatewaymid.repository.CashGatewayMidRepository
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.math.BigDecimal

@Component
class DummyPaymentGatewayProvider(
    private val objectMapper: ObjectMapper,
    private val cashGatewayMidRepository: CashGatewayMidRepository,
    @Value("\${payment.gateway.dummy-pg.url}") private val pgBaseUrl: String,
    @Value("\${payment.gateway.dummy-pg.default-pg-mid}") private val defaultPgMid: String
) : PaymentGatewayProvider {

    companion object {
        private const val ENDPOINT_PATH = "/api/payment-process"
        private const val SUCCESS_CODE = "0000"
    }

    override fun getProvider(): Provider = Provider.DUMMY

    override fun getEndpoint(): String = "${pgBaseUrl}${ENDPOINT_PATH}"

    /**
     * Cash Gateway MID → PG MID 변환
     *
     * @param cashGatewayMid Cash Gateway MID (ctx.cashGatewayMid)
     * @return PG MID (PG사에 등록된 실제 가맹점 ID)
     */
    private fun resolvePgMid(cashGatewayMid: String): String {
        val mapping = cashGatewayMidRepository.findByProviderAndMidOrThrow(Provider.DUMMY, cashGatewayMid)
        return mapping.pgMid
    }

    override fun prepareRequest(paymentCtx: PaymentCtx): PaymentRequest {
        val pgMid = resolvePgMid(paymentCtx.cashGatewayMid)

        return if (paymentCtx.paymentStatus == PaymentStatus.APPROVED) {
            DummyPaymentRequest(
                midId = pgMid,
                userKeycloakId = paymentCtx.userKeycloakId,
                orderId = paymentCtx.orderNumber,
                amount = paymentCtx.amount,
                echo = mapOf(
                    "orderNumber" to paymentCtx.orderNumber
                )
            )
        } else {
            val cancelCtx = paymentCtx as CancelPaymentCtx
            DummyPaymentCancelRequest(
                midId = pgMid,
                userKeycloakId = paymentCtx.userKeycloakId,
                orderId = paymentCtx.orderNumber,
                amount = paymentCtx.amount,
                tid = cancelCtx.originTid,
                cancel = "CANCEL",
                echo = mapOf(
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
        return response.isSuccess()
    }

    /**
     * Dummy PG는 비동기 방식
     * - 200 OK = 요청 접수 (승인 아님)
     * - 실제 승인/실패는 Webhook으로 수신
     */
    override fun isSynchronousApproval(): Boolean = false

    /**
     * PG 응답으로부터 Cash Gateway MID 후보 목록을 추출
     *
     * Dummy PG의 추적 전략:
     * 1. webhook 응답의 midId 필드에서 PG MID를 추출
     * 2. PG MID → CashGatewayMid 테이블 역추적 (N:1이므로 복수 결과 가능)
     * 3. 매핑된 Cash Gateway MID 목록을 반환
     *
     * 호출자가 반환된 후보 목록 + orderNumber 등의 context를 조합하여
     * 정확한 Cash Gateway MID를 특정해야 함.
     */
    override fun extractCashGatewayMidCandidates(response: PaymentResponse): List<String> {
        if (response !is DummyPaymentResponse) return emptyList()

        // PG MID → Cash Gateway MID 후보 목록 역추적 (N:1)
        val mappings = cashGatewayMidRepository.findAllByProviderAndPgMid(Provider.DUMMY, response.midId)
        return mappings.map { it.mid }
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

    override fun getDefaultPgMid(): String = defaultPgMid

    data class DummyPaymentRequest(
        val midId: String,
        @JsonProperty("userId")
        val userKeycloakId: String,
        val orderId: String,
        private val amount: BigDecimal,
        val echo: Map<String, Any?> = emptyMap()
    ) : PaymentRequest {
        override fun getMid(): String = midId

        override fun getAmount(): BigDecimal = amount

        override fun getRequestType(): PaymentStatus = PaymentStatus.APPROVED
    }

    data class DummyPaymentCancelRequest(
        val midId: String,
        @JsonProperty("userId")
        val userKeycloakId: String,
        val orderId: String,
        private val amount: BigDecimal,
        val tid: String,
        private val cancel: String,
        val echo: Map<String, Any?> = emptyMap()
    ) : PaymentCancelRequest {
        override fun getMid(): String = midId

        override fun getAmount(): BigDecimal = amount

        override fun getPgTransaction(): String = tid

        override fun getCancel(): String = cancel

        override fun getRequestType(): PaymentStatus = PaymentStatus.CANCELLED
    }

    /**
     * Hamster PG Webhook 응답 DTO
     *
     * hamster-pg가 보내는 실제 스펙:
     * - tid: PG 거래 ID (e.g., DUMMY_20260219_12345678)
     * - orderId: 주문 ID
     * - amount: 금액
     * - status: "COMPLETED" / "FAILED"
     * - approvalNo: 승인번호 (성공 시)
     * - failureReason: 실패 사유
     * - echo: JSON 문자열 (요청 시 보낸 echo를 직렬화한 형태)
     *
     * Cash Gateway에서는 echo JSON String을 파싱하여 gatewayReferenceId 등을 추출한다.
     */
    data class DummyPaymentResponse(

        @JsonProperty("tid")
        private val tidValue: String,

        @JsonProperty("midId")
        val midId: String,

        @JsonProperty("userId")
        private val userKeycloakId: String,  // PG 응답의 userId = Cash Gateway의 keycloakId

        @JsonProperty("orderId")
        val orderId: String,

        @JsonProperty("amount")
        private val amountValue: BigDecimal,

        @JsonProperty("status")
        val status: String,

        @JsonProperty("approvalNo")
        private val approvalNoValue: String? = null,

        @JsonProperty("failureReason")
        val failureReason: String? = null,

        @JsonProperty("echo")
        val echoRaw: Any? = null  // hamster-pg는 JSON String으로 보냄

    ) : PaymentResponse {

        override fun getCode(): String = if (status == "COMPLETED") SUCCESS_CODE else "9999"

        override fun getMessage(): String = failureReason ?: if (status == "COMPLETED") "승인 완료" else "결제 실패"

        override fun getPgTransaction(): String = tidValue

        override fun getPgApprovalNo(): String? = approvalNoValue

        override fun getAmount(): BigDecimal = amountValue

        override fun getMid(): String = midId

        override fun getUserId(): String = userKeycloakId

        override fun isSuccess(): Boolean = status == "COMPLETED"

        /**
         * echo를 Map으로 반환
         *
         * hamster-pg는 echo를 JSON String으로 보내므로, Jackson ObjectMapper로 파싱한다.
         * 이미 Map으로 역직렬화된 경우 그대로 반환한다.
         */
        @JsonIgnore
        override fun getEcho(): Map<String, Any?> {
            return when (echoRaw) {
                is Map<*, *> -> echoRaw as Map<String, Any?>
                is String -> {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(echoRaw, Map::class.java) as Map<String, Any?>
                    } catch (e: Exception) {
                        emptyMap()
                    }
                }
                else -> emptyMap()
            }
        }
    }
}
