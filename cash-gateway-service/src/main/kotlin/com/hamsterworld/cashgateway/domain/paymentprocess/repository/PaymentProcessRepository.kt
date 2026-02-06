package com.hamsterworld.cashgateway.domain.paymentprocess.repository

import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.domain.paymentprocess.model.QPaymentProcess.paymentProcess
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.querydsl.core.BooleanBuilder
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional

@Repository
class PaymentProcessRepository(
    private val paymentProcessJpaRepository: PaymentProcessJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(process: PaymentProcess): PaymentProcess {
        return paymentProcessJpaRepository.save(process)
    }

    fun findById(id: Long): PaymentProcess {
        return paymentProcessJpaRepository.findById(id)
            .orElseThrow { throw RuntimeException("PaymentProcess를 찾을 수 없습니다. ID: $id") }
    }

    fun findUnknownAttempt(orderPublicId: String, userPublicId: String, provider: Provider): Optional<PaymentProcess> {
        return paymentProcessJpaRepository
            .findTopByOrderPublicIdAndUserPublicIdAndProviderAndStatus(
                orderPublicId,
                userPublicId,
                provider,
                PaymentProcessStatus.UNKNOWN
            )
    }

    fun casUpdatedMarking(process: PaymentProcess): Optional<Long> {
        // PENDING -> SUCCESS, FAILED는 승인 플로우
        // PENDING -> CANCELLED 취소 플로우 (결과 해당 이력은, 취소 이력이기에, 오리진을 향하는 이력이 존재해야만 한다)

        val updatedBuilder = BooleanBuilder()
            .and(paymentProcess.orderPublicId.eq(process.orderPublicId))
            .and(paymentProcess.userPublicId.eq(process.userPublicId))
            .and(paymentProcess.provider.eq(process.provider))
            .and(paymentProcess.status.eq(PaymentProcessStatus.PENDING))

        if (process.originProcessId != null) {
            updatedBuilder.and(paymentProcess.originProcessId.isNotNull)
        } else {
            updatedBuilder.and(paymentProcess.originProcessId.isNull)
        }

        val updated = jpaQueryFactory
            .update(paymentProcess)
            .set(paymentProcess.status, process.status)
            .set(paymentProcess.code, process.code)
            .set(paymentProcess.message, process.message)
            .set(paymentProcess.pgTransaction, process.pgTransaction)
            .set(paymentProcess.pgApprovalNo, process.pgApprovalNo)
            .set(paymentProcess.responsePayload, process.responsePayload)
            .set(paymentProcess.activeRequestKey, null as String?)
            .set(paymentProcess.modifiedAt, LocalDateTime.now())
            .where(updatedBuilder)
            .execute()

        if (updated != 1L) return Optional.empty()

        val targetBuilder = BooleanBuilder()
            .and(paymentProcess.orderPublicId.eq(process.orderPublicId))
            .and(paymentProcess.userPublicId.eq(process.userPublicId))
            .and(paymentProcess.provider.eq(process.provider))

        if (process.originProcessId != null) {
            targetBuilder.and(paymentProcess.originProcessId.isNotNull)
        } else {
            targetBuilder.and(paymentProcess.originProcessId.isNull)
        }

        val entity = jpaQueryFactory
            .selectFrom(paymentProcess)
            .where(targetBuilder)
            .fetchOne()

        return Optional.ofNullable(entity?.id)
    }

    fun findByOrderPublicId(orderPublicId: String): List<PaymentProcess> {
        return jpaQueryFactory
            .selectFrom(paymentProcess)
            .where(paymentProcess.orderPublicId.eq(orderPublicId))
            .fetch()
    }

    fun findByPgTransaction(tid: String): PaymentProcess? {
        return paymentProcessJpaRepository.findByPgTransaction(tid)
    }

    /**
     * Provider + MID로 PaymentProcess 조회
     *
     * Webhook에서 내부 거래 조회 (정확한 매칭)
     * - Provider: PG사
     * - mid: Cash Gateway MID
     */
    fun findByProviderAndMid(
        provider: Provider,
        mid: String
    ): PaymentProcess {
        return paymentProcessJpaRepository.findByProviderAndMid(
            provider, mid
        ).orElseThrow{ CustomRuntimeException(
            "[${provider.name}] PaymentProcess 조회 실패 | " +
                    "provider=${provider.name}, mid=$mid") }
    }

    /**
     * 특정 상태의 PaymentProcess 조회 (페이징 적용)
     * 스케줄러에서 UNKNOWN 상태를 배치로 조회
     */
    fun findByStatusWithLimit(status: PaymentProcessStatus, pageable: Pageable): List<PaymentProcess> {
        return jpaQueryFactory
            .selectFrom(paymentProcess)
            .where(paymentProcess.status.eq(status))
            .orderBy(paymentProcess.createdAt.asc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()
    }

    /**
     * CAS 업데이트 - 상태 전환 + 메타데이터 (UNKNOWN → PENDING)
     * QueryDSL을 사용한 원자적 업데이트
     *
     * @return 업데이트된 행 수 (1 = 성공, 0 = 실패)
     */
    fun casUpdateToPending(
        id: Long,
        expectedStatus: PaymentProcessStatus,
        newStatus: PaymentProcessStatus,
        requestedAt: LocalDateTime,
        ackReceivedAt: LocalDateTime?,
        responseCode: String?,
        pgTransaction: String?,
        responsePayload: String?
    ): Int {
        var updateQuery = jpaQueryFactory
            .update(paymentProcess)
            .set(paymentProcess.status, newStatus)
            .set(paymentProcess.requestedAt, requestedAt)
            .set(paymentProcess.lastRequestAttemptAt, requestedAt)
            .set(paymentProcess.requestAttemptCount, paymentProcess.requestAttemptCount.add(1))
            .set(paymentProcess.ackReceivedAt, ackReceivedAt)
            .set(paymentProcess.lastPgResponseCode, responseCode)
            .set(paymentProcess.responsePayload, responsePayload)
            .set(paymentProcess.modifiedAt, LocalDateTime.now())

        // pgTransaction이 있을 때만 업데이트
        if (pgTransaction != null) {
            updateQuery = updateQuery.set(paymentProcess.pgTransaction, pgTransaction)
        }

        val updated = updateQuery
            .where(
                paymentProcess.id.eq(id)
                    .and(paymentProcess.status.eq(expectedStatus))
            )
            .execute()

        return updated.toInt()
    }

    /**
     * CAS 업데이트 - Webhook 응답 처리 (PENDING → SUCCESS/FAILED)
     * QueryDSL을 사용한 원자적 업데이트
     */
    fun casUpdateWebhookResponse(
        id: Long,
        expectedStatus: PaymentProcessStatus,
        newStatus: PaymentProcessStatus,
        pgTransaction: String?,
        pgApprovalNo: String?,
        responsePayload: String?,
        code: String?,
        message: String?
    ): Int {
        val updated = jpaQueryFactory
            .update(paymentProcess)
            .set(paymentProcess.status, newStatus)
            .set(paymentProcess.pgTransaction, pgTransaction)
            .set(paymentProcess.pgApprovalNo, pgApprovalNo)
            .set(paymentProcess.responsePayload, responsePayload)
            .set(paymentProcess.code, code)
            .set(paymentProcess.message, message)
            .set(paymentProcess.modifiedAt, LocalDateTime.now())
            .where(
                paymentProcess.id.eq(id)
                    .and(paymentProcess.status.eq(expectedStatus))
            )
            .execute()

        return updated.toInt()
    }
}
