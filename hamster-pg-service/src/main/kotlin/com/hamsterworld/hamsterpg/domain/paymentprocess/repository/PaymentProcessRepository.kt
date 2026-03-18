package com.hamsterworld.hamsterpg.domain.paymentprocess.repository

import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.QPaymentProcess.paymentProcess as qPaymentProcess
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class PaymentProcessRepository(
    private val jpaRepository: PaymentProcessJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(process: PaymentProcess): PaymentProcess {
        return jpaRepository.save(process)
    }

    fun findById(id: Long): PaymentProcess? {
        return jpaRepository.findById(id).orElse(null)
    }

    fun findByTid(tid: String): PaymentProcess? {
        return jpaRepository.findByTid(tid)
    }

    fun findByStatusWithLimit(status: PaymentProcessStatus, pageable: Pageable): List<PaymentProcess> {
        return jpaQueryFactory
            .selectFrom(qPaymentProcess)
            .where(qPaymentProcess.status.eq(status))
            .orderBy(qPaymentProcess.requestedAt.asc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()
    }

    fun casUpdateToProcessing(
        id: Long,
        expectedStatus: PaymentProcessStatus,
        newStatus: PaymentProcessStatus,
        processingStartedAt: LocalDateTime
    ): Int {
        val updated = jpaQueryFactory
            .update(qPaymentProcess)
            .set(qPaymentProcess.status, newStatus)
            .set(qPaymentProcess.processingStartedAt, processingStartedAt)
            .set(qPaymentProcess.modifiedAt, LocalDateTime.now())
            .where(
                qPaymentProcess.id.eq(id)
                    .and(qPaymentProcess.status.eq(expectedStatus))
            )
            .execute()

        return updated.toInt()
    }

    fun casUpdateToFinal(
        id: Long,
        expectedStatus: PaymentProcessStatus,
        newStatus: PaymentProcessStatus,
        approvalNo: String?,
        failReason: String?,
        processedAt: LocalDateTime
    ): Int {
        val updated = jpaQueryFactory
            .update(qPaymentProcess)
            .set(qPaymentProcess.status, newStatus)
            .set(qPaymentProcess.approvalNo, approvalNo)
            .set(qPaymentProcess.failReason, failReason)
            .set(qPaymentProcess.processedAt, processedAt)
            .set(qPaymentProcess.modifiedAt, LocalDateTime.now())
            .where(
                qPaymentProcess.id.eq(id)
                    .and(qPaymentProcess.status.eq(expectedStatus))
            )
            .execute()

        return updated.toInt()
    }
}
