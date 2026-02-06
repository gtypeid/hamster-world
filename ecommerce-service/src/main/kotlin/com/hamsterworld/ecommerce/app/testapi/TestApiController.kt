package com.hamsterworld.ecommerce.app.testapi

import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import kotlin.random.Random

@RestController
@RequestMapping("/api/payment")
class TestApiController(
    environment: Environment
) {
    private val log = LoggerFactory.getLogger(TestApiController::class.java)
    private val random = Random
    private val alwaysSucceed: Boolean

    init {
        // 테스트 프로파일이거나 테스트 환경에서는 항상 성공
        val appName = environment.getProperty("spring.application.name", "")
        this.alwaysSucceed = appName.contains("test")
    }

    /**
     * 모의 결제 / 취소 API
     * - cancel 값이 "CANCEL"이면 취소로 간주
     * - 결제는 60% 확률로 성공, 취소는 80% 확률로 성공
     */
    @PostMapping
    fun mockPayment(@RequestBody request: PaymentRequest): PaymentResponse {
        log.info("[Mock PG] 요청 수신: {}", request)

        // 취소 요청인지 체크
        if ("CANCEL".equals(request.cancel, ignoreCase = true)) {
            return handleCancel(request)
        }

        // 결제 요청 처리
        return handleApprove(request)
    }

    private fun handleApprove(request: PaymentRequest): PaymentResponse {
        val isSuccess = alwaysSucceed || random.nextDouble() > 0.4

        if (isSuccess) {
            val transactionId = "txn_${random.nextLong().toString(16)}"
            val approvalNo = (100000 + random.nextInt(899999)).toString()

            val res = PaymentResponse(
                status = "SUCCESS",
                code = "0000",
                transactionId = transactionId,
                approvalNo = approvalNo,
                echo = mapOf(
                    "orderId" to request.orderId,
                    "amount" to request.amount
                ),
                message = "Payment processed successfully"
            )

            log.info("[Mock PG] 결제 성공 응답: {}", res)
            return res
        }

        val failCode = if (random.nextBoolean()) "E3001" else "E5000"
        val failMsg = if (failCode == "E3001") {
            "Payment failed: Insufficient balance"
        } else {
            "Payment failed: Network error, please try again later"
        }

        val fail = PaymentResponse(
            status = "FAILED",
            code = failCode,
            transactionId = null,
            approvalNo = null,
            echo = mapOf(
                "orderId" to request.orderId,
                "amount" to request.amount
            ),
            message = failMsg
        )

        log.warn("[Mock PG] 결제 실패 응답: {}", fail)
        return fail
    }

    private fun handleCancel(request: PaymentRequest): PaymentResponse {
        log.info("[Mock PG] 취소 요청 처리: {}", request)

        // 취소는 80% 확률로 성공 (좀 더 잘 성공하는 시뮬레이션)
        val isSuccess = alwaysSucceed || random.nextDouble() > 0.2

        if (isSuccess) {
            val res = PaymentResponse(
                status = "SUCCESS",
                code = "0000",
                transactionId = request.tid,
                approvalNo = null,
                echo = mapOf(
                    "orderId" to request.orderId,
                    "amount" to request.amount
                ),
                message = "Payment cancelled successfully"
            )

            log.info("[Mock PG] 결제 취소 성공 응답: {}", res)
            return res
        }

        val failCode = "C9001"
        val failMsg = "Payment cancel failed: Transaction not found or already cancelled"

        val fail = PaymentResponse(
            status = "FAILED",
            code = failCode,
            transactionId = request.tid,
            approvalNo = null,
            echo = mapOf(
                "orderId" to request.orderId,
                "amount" to request.amount
            ),
            message = failMsg
        )

        log.warn("[Mock PG] 결제 취소 실패 응답: {}", fail)
        return fail
    }

    // ----------------------
    // DTOs
    // ----------------------

    data class PaymentRequest(
        val userId: Long? = null,
        val orderId: String? = null,
        val amount: BigDecimal? = null,
        val tid: String? = null,
        val cancel: String? = null // "CANCEL"이면 취소 요청
    )

    data class PaymentResponse(
        val status: String,
        val code: String,
        val transactionId: String?,
        val approvalNo: String?,
        val echo: Map<String, Any?>,
        val message: String
    )
}
