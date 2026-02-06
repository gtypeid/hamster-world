package com.hamsterworld.cashgateway.app.paymentprocess.controller

import com.hamsterworld.cashgateway.app.paymentprocess.response.PaymentProcessResponse
import com.hamsterworld.cashgateway.domain.paymentprocess.dto.PaymentProcessSearchRequest
import com.hamsterworld.cashgateway.domain.paymentprocess.service.PaymentProcessService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 통신 프로세스 조회 컨트롤러 (Communication Process Tracker)
 *
 * **용도**: PG 통신 상태 추적 (PaymentProcess = Communication Truth)
 *
 * **엔드포인트**:
 * 1. GET /api/payment-processes/list - 통신 프로세스 목록 조회
 * 2. GET /api/payment-processes/page - 통신 프로세스 페이징 조회
 *
 * **호출 대상**:
 * - Internal Admin Portal (`/gateway/processes` 화면)
 * - 운영 모니터링 시스템
 *
 * **응답 데이터**:
 * - PaymentProcess 정보 (Communication Truth)
 * - originProcessPublicId 포함 (취소 프로세스인 경우 원본 프로세스 Public ID)
 * - 내부 PK (originProcessId: Long)는 절대 노출하지 않음
 *
 * **용어 정리**:
 * - "통신 프로세스" = PaymentProcess (PG 통신 상태 머신)
 * - "거래 내역" = Payment (Business Truth - 확정된 거래 기록)
 */
@RestController
@RequestMapping("/api/payment-processes")
class PaymentProcessController(
    private val paymentProcessService: PaymentProcessService
) {
    private val log = LoggerFactory.getLogger(PaymentProcessController::class.java)

    /**
     * PaymentProcess 목록 조회 (List)
     *
     * @param request PaymentProcessSearchRequest
     * @return List<PaymentProcessResponse>
     */
    @GetMapping("/list")
    fun getPaymentProcessList(
        request: PaymentProcessSearchRequest
    ): ResponseEntity<List<PaymentProcessResponse>> {
        log.debug("[PaymentProcess 목록 조회] orderPublicId={}, provider={}, status={}",
            request.orderPublicId, request.provider, request.statuses)

        val responses = paymentProcessService.searchPaymentProcesses(request)

        log.debug("[PaymentProcess 목록 조회 완료] count={}", responses.size)

        return ResponseEntity.ok(responses)
    }

    /**
     * PaymentProcess 페이징 조회 (Page)
     *
     * @param request PaymentProcessSearchRequest
     * @return Page<PaymentProcessResponse>
     */
    @GetMapping("/page")
    fun getPaymentProcessPage(
        request: PaymentProcessSearchRequest
    ): ResponseEntity<Page<PaymentProcessResponse>> {
        log.debug("[PaymentProcess 페이징 조회] orderPublicId={}, provider={}, status={}, page={}, size={}",
            request.orderPublicId, request.provider, request.statuses, request.page, request.size)

        val responses = paymentProcessService.searchPaymentProcessPage(request)

        log.debug("[PaymentProcess 페이징 조회 완료] totalElements={}, totalPages={}",
            responses.totalElements, responses.totalPages)

        return ResponseEntity.ok(responses)
    }
}
