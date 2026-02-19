package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.domain.payment.event.PaymentApprovedEvent
import com.hamsterworld.cashgateway.domain.payment.event.PaymentCancelledEvent
import com.hamsterworld.cashgateway.domain.payment.event.PaymentFailedEvent
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentGatewayCoreService(
    private val paymentProcessRepository: PaymentProcessRepository,
    private val eventPublisher: ApplicationEventPublisher
) {

    private val log = LoggerFactory.getLogger(PaymentGatewayCoreService::class.java)

    /**
     * tid로 PaymentAttempt 조회
     */
    fun findAttemptByTid(tid: String): PaymentProcess? {
        return paymentProcessRepository.findByPgTransaction(tid)
    }

    /**
     * orderNumber + provider로 PENDING 상태의 PaymentProcess 조회
     *
     * Webhook에서 PaymentProcess를 찾기 위해 사용.
     * ACK에 tid가 없으므로 pgTransaction 기반 조회 대신 사용한다.
     */
    fun findPendingByOrderNumberAndProvider(orderNumber: String, provider: Provider): PaymentProcess? {
        return paymentProcessRepository.findPendingByOrderNumberAndProvider(orderNumber, provider)
    }

    /**
     * CashGatewayMid + provider로 PENDING PaymentProcess 조회
     *
     * Webhook Step 3에서 사용: 확정된 CashGatewayMid로 PENDING 상태의 PaymentProcess를 찾는다.
     */
    fun findPendingByCashGatewayMidAndProvider(cashGatewayMid: String, provider: Provider): PaymentProcess? {
        return paymentProcessRepository.findPendingByCashGatewayMidAndProvider(cashGatewayMid, provider)
    }

    /**
     * Provider + MID로 PaymentAttempt 조회
     */
    fun findByProviderAndCashGatewayMid(
        provider: Provider,
        cashGatewayMid: String
    ): PaymentProcess {
        return paymentProcessRepository.findByProviderAndCashGatewayMid(
            provider, cashGatewayMid
        )
    }

    /**
     * PaymentAttempt 요청 기록
     *
     * **트랜잭션 전파 정책 변경 이력**:
     * - 기존: `REQUIRES_NEW` (별도 트랜잭션, 즉시 커밋)
     *   - 목적: "언제나 요청 기록 남김" (감사 로그)
     *   - 적합한 경우: 일반 동기 서비스 (HTTP API)
     *   - 문제점: 이벤트 기반 아키텍처에서 복잡성 증가
     *     1. PaymentAttempt 커밋 + ProcessedEvent 롤백 = 중복 처리 위험
     *     2. Kafka 재시도 vs DB 커밋 = 정합성 불일치
     *     3. 원자성 깨짐 (일부는 커밋, 일부는 롤백)
     *
     * - 변경: `MANDATORY` (부모 트랜잭션 참여)
     *   - 목적: Kafka Consumer 트랜잭션과 원자성 보장
     *   - 적합한 경우: 이벤트 기반 서비스 (Kafka Consumer)
     *   - 장점:
     *     1. PG 실패 시 전체 롤백 (PaymentAttempt + ProcessedEvent + Kafka 오프셋)
     *     2. Kafka 자동 재시도 (멱등성: ProcessedEvent의 eventId)
     *     3. 원자성 보장 (모두 성공 or 모두 롤백)
     *
     * **멱등성 전략**:
     * - ProcessedEvent (eventId 중복 체크) - BaseKafkaConsumer
     * - active_request_key (orderId + userId + provider) - DB UNIQUE 제약
     *
     * **실패 시 동작**:
     * - PG 통신 실패 → 전체 롤백 → Kafka 재시도 (최대 3회)
     * - 재시도 실패 → DLT (Dead Letter Topic) 이동 → 수동 처리
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun handleRequest(process: PaymentProcess) {

        // 외부 거래는 중복 체크 스킵 (orderId 없음)
        if (process.isExternal()) {
            paymentProcessRepository.save(process.onCreate())
            log.info("[외부 거래 기록 완료] provider={}, originSource={}, mid={}, tid={}, gatewayReferenceId={}",
               process.provider,process.originSource,process.cashGatewayMid,process.pgTransaction,process.gatewayReferenceId)

            // 이벤트는 PaymentProcess.onCreate()에서 등록, save() 시 자동 발행
            return
        }

        val existingProcess = paymentProcessRepository.findUnknownAttempt(
           process.orderPublicId!!,  // 내부 요청은 orderPublicId 필수
           process.userKeycloakId,
           process.provider!!
        )

        if (existingProcess.isEmpty) {
            try {
                paymentProcessRepository.save(process.onCreate())
                log.info("[PG 프로세스 시작] provider={}, gatewayReferenceId={}",
                   process.provider,process.gatewayReferenceId)

                // Order 상태 변경은 이벤트 발행으로 처리
                // ecommerce-service가 InternalPaymentProcessCreatedEvent 구독하여 Order 상태 변경
                // 이벤트는 PaymentProcess.onCreate()에서 등록, save() 시 자동 발행
                log.debug("[이벤트 등록] InternalPaymentProcessCreatedEvent (save 시 자동 발행), orderPublicId={}",process.orderPublicId)

            } catch (e: DataIntegrityViolationException) {
                // 레이스 컨디션으로 애플리케이션 체크는 통과했지만, DB unique constraint에서 막힌 경우
                log.warn("[DB 레벨 중복 방지] active_request_key 제약 위반, orderPublicId={}",process.orderPublicId, e)
                throw CustomRuntimeException(
                    "이미 진행 중인 프로세스 있습니다. orderPublicId=${process.orderPublicId}, gatewayReferenceId=${process.gatewayReferenceId}"
                )
            }
        } else {
            log.debug("[PG 요청 중복 무시] 이미 UNKNOWN 상태 존재 orderPublicId={}",process.orderPublicId)
            throw CustomRuntimeException(
                "이미 진행 중인 결제 프로세스 있습니다. orderPublicId=${process.orderPublicId}, gatewayReferenceId=${process.gatewayReferenceId}"
            )
        }
    }

    /**
     * PaymentAttempt 실패 응답 처리
     *
     * **트랜잭션 전파 정책 변경 이력**:
     * - 기존: `REQUIRES_NEW` (별도 트랜잭션, 즉시 커밋)
     *   - 목적: "언제나 응답 기록 남김" (PG 실패도 기록)
     *   - 문제점: handleRequest()와 동일한 이슈
     *     1. PaymentAttempt 업데이트 커밋 + ProcessedEvent 롤백 = 불일치
     *     2. Webhook 재전송 시 CAS 실패 (이미 FAILED로 업데이트됨)
     *
     * - 변경: `MANDATORY` (부모 트랜잭션 참여)
     *   - 목적: Webhook Consumer 트랜잭션과 원자성 보장
     *   - 호출 경로:
     *     1. Webhook Consumer → handleWebhook() → handleInternalWebhook() → handleResponseFailure()
     *     2. 모두 하나의 트랜잭션 (MANDATORY 체인)
     *   - 장점:
     *     1. Webhook 처리 실패 시 전체 롤백
     *     2. Webhook 재전송 → CAS 재시도 (UNKNOWN → FAILED)
     *     3. 멱등성: Webhook tid 중복 체크 or ProcessedEvent
     *
     * **CAS (Compare-And-Swap)**:
     * - UNKNOWN → FAILED 로 상태 전이
     * - 동시성 안전 (낙관적 락)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun handleResponseFailure(event: PaymentProcess) {
        // Webhook에서 호출 시 이미 id가 있음 (PENDING 상태)
        if (event.id != null) {
            val updated = paymentProcessRepository.casUpdateWebhookResponse(
                id = event.id!!,
                expectedStatus = PaymentProcessStatus.PENDING,
                newStatus = PaymentProcessStatus.FAILED,
                pgTransaction = event.pgTransaction,
                pgApprovalNo = event.pgApprovalNo,
                responsePayload = event.responsePayload,
                code = event.code,
                message = event.message
            )

            if (updated > 0) {
                log.info("[PG 응답 실패 기록 완료] processId={}, orderPublicId={}, status=FAILED",
                    event.id, event.orderPublicId)

                // 실패는 Payment 엔티티 없이 CoreService에서 직접 이벤트 발행
                val reason = event.message ?: event.code ?: "Unknown error"
                eventPublisher.publishEvent(PaymentFailedEvent.from(event, reason, event.userKeycloakId))
                log.debug("[이벤트 발행] PaymentFailedEvent, orderPublicId={}, reason={}", event.orderPublicId, reason)
            } else {
                log.warn("[CAS 업데이트 실패] processId={}, orderPublicId={}, expected=PENDING",
                    event.id, event.orderPublicId)
            }
        } else {
            // Legacy path (현재 사용 안함)
            val updatedIdOpt = paymentProcessRepository.casUpdatedMarking(event)
            if (updatedIdOpt.isPresent) {
                log.info("[PG 응답 실패 기록 완료] orderPublicId={}, status={}", event.orderPublicId, event.status)

                val reason = event.message ?: event.code ?: "Unknown error"
                eventPublisher.publishEvent(PaymentFailedEvent.from(event, reason, event.userKeycloakId))
                log.debug("[이벤트 발행] PaymentFailedEvent, orderPublicId={}, reason={}", event.orderPublicId, reason)
            } else {
                log.warn("[PG 응답 실패 마킹 실패] orderPublicId={}, status={}", event.orderPublicId, event.status)
            }
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun handleResponseSuccess(event: PaymentProcess) {
        // Webhook에서 호출 시 이미 id가 있음 (PENDING 상태)
        if (event.id != null) {
            val updated = paymentProcessRepository.casUpdateWebhookResponse(
                id = event.id!!,
                expectedStatus = PaymentProcessStatus.PENDING,
                newStatus = PaymentProcessStatus.SUCCESS,
                pgTransaction = event.pgTransaction,
                pgApprovalNo = event.pgApprovalNo,
                responsePayload = event.responsePayload,
                code = event.code,
                message = event.message
            )

            if (updated > 0) {
                log.info("[PG 응답 성공 기록 완료] processId={}, orderPublicId={}, transactionId={}",
                    event.id, event.orderPublicId, event.pgTransaction)

                // PaymentProcess에서 직접 PaymentApprovedEvent 발행
                eventPublisher.publishEvent(PaymentApprovedEvent.from(event))
                log.debug("[이벤트 발행] PaymentApprovedEvent, processId={}, orderPublicId={}",
                    event.id, event.orderPublicId)
            } else {
                log.warn("[CAS 업데이트 실패] processId={}, orderPublicId={}, expected=PENDING",
                    event.id, event.orderPublicId)
            }
        } else {
            // Legacy path (현재 사용 안함)
            val updatedIdOpt = paymentProcessRepository.casUpdatedMarking(event)
            if (updatedIdOpt.isPresent) {
                log.info("[PG 응답 기록 완료] orderPublicId={}, status={}, transactionId={}",
                    event.orderPublicId, event.status, event.pgTransaction)

                // PaymentProcess에서 직접 PaymentApprovedEvent 발행
                eventPublisher.publishEvent(PaymentApprovedEvent.from(event))
                log.debug("[이벤트 발행] PaymentApprovedEvent, orderPublicId={}", event.orderPublicId)
            } else {
                log.warn("[CAS 업데이트 실패] orderPublicId={}, status={}",
                    event.orderPublicId, event.status)
            }
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun handleCancelledResponseSuccess(event: PaymentProcess) {
        val updatedIdOpt = paymentProcessRepository.casUpdatedMarking(event)
        if (updatedIdOpt.isPresent) {
            log.info("[PG 취소 응답 기록 완료] orderPublicId={}, status={}, transactionId={}",
                event.orderPublicId,
                event.status,
                event.pgTransaction)

            // PG사 취소 승인 시 이벤트 직접 발행
            if (event.status == PaymentProcessStatus.CANCELLED) {
                // 원본 SUCCESS 프로세스 조회 (같은 orderPublicId의 승인건)
                val originProcess = paymentProcessRepository.findByOrderPublicIdAndStatus(
                    event.orderPublicId!!,
                    PaymentProcessStatus.SUCCESS
                ) ?: throw CustomRuntimeException(
                    "원본 결제 프로세스를 찾을 수 없습니다. orderPublicId=${event.orderPublicId}"
                )

                // PaymentCancelledEvent 직접 발행
                eventPublisher.publishEvent(PaymentCancelledEvent.from(event, originProcess))
                log.debug("[이벤트 발행] PaymentCancelledEvent, orderPublicId={}, originProcessId={}",
                    event.orderPublicId, originProcess.id)
            }
        } else {
            log.warn("[CAS 업데이트 실패] orderPublicId={}, status={}",
                event.orderPublicId,
                event.status)
        }
    }
}
