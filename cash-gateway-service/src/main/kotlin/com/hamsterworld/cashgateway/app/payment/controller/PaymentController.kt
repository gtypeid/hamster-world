//package com.hamsterworld.cashgateway.app.payment.controller
//
//import com.hamsterworld.cashgateway.app.payment.dto.CashGatewayResponse
//import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
//import com.hamsterworld.cashgateway.app.payment.service.PaymentService
//import org.slf4j.LoggerFactory
//import org.springframework.http.ResponseEntity
//import org.springframework.web.bind.annotation.*
//
///**
// * 결제 요청 컨트롤러
// *
// * **엔드포인트**:
// * 1. POST /api/payment/approve - 결제 승인 요청 (Cash Gateway → PG)
// *
// * **호출 방식**:
// * 1. **Kafka 이벤트 기반 (기본 플로우)**:
// *    - Payment Service에서 OrderStockReservedEvent 발행
// *    - PaymentEventConsumer가 컨슘하여 PaymentService.approve() 호출
// * 2. **직접 REST 호출 (확장 가능)**:
// *    - Internal Admin, 외부 파트너 등에서 직접 호출 가능
// *
// * **처리 플로우**:
// * - Cash Gateway가 PG에 결제 요청 전송
// * - 응답: CashGatewayResponse (Webhook 대기)
// */
//@RestController
//@RequestMapping("/api/payment")
//class PaymentController(
//    private val paymentService: PaymentService
//) {
//    private val log = LoggerFactory.getLogger(PaymentController::class.java)
//
//    /**
//     * 내부 결제 승인 요청
//     *
//     * @param request PaymentApproveRequest (orderPublicId, userPublicId, amount, provider, orderNumber)
//     * @return CashGatewayResponse (success, message, orderPublicId)
//     */
//    @PostMapping("/approve")
//    fun approve(@RequestBody request: PaymentApproveRequest): ResponseEntity<CashGatewayResponse> {
//        log.info("[결제 승인 요청] orderPublicId={}, provider={}, amount={}",
//            request.orderPublicId, request.provider, request.amount)
//
//        val response = paymentService.approve(request)
//
//        log.info("[결제 승인 요청 완료] orderPublicId={}, message={}",
//            request.orderPublicId, response.message)
//
//        return ResponseEntity.ok(response)
//    }
//}
