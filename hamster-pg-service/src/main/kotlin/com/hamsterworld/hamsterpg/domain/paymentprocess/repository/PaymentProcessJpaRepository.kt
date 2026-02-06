package com.hamsterworld.hamsterpg.domain.paymentprocess.repository

import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface PaymentProcessJpaRepository : JpaRepository<PaymentProcess, Long> {

    fun findByTid(tid: String): PaymentProcess?

    fun findByStatus(status: PaymentProcessStatus): List<PaymentProcess>

    /**
     * 특정 상태의 PaymentProcess 조회 (배치 처리용, Limit 적용)
     */
    @Query("SELECT p FROM PaymentProcess p WHERE p.status = :status ORDER BY p.requestedAt ASC")
    fun findByStatusWithLimit(
        @Param("status") status: PaymentProcessStatus,
        pageable: Pageable
    ): List<PaymentProcess>

    /**
     * CAS 업데이트: PENDING → PROCESSING
     *
     * @return 업데이트된 행의 수 (0이면 이미 다른 스케줄러가 처리 중)
     */
    @Modifying
    @Query("""
        UPDATE PaymentProcess p
        SET p.status = :newStatus,
            p.processingStartedAt = :processingStartedAt
        WHERE p.id = :id
          AND p.status = :expectedStatus
    """)
    fun casUpdateToProcessing(
        @Param("id") id: Long,
        @Param("expectedStatus") expectedStatus: PaymentProcessStatus,
        @Param("newStatus") newStatus: PaymentProcessStatus,
        @Param("processingStartedAt") processingStartedAt: LocalDateTime
    ): Int

    /**
     * CAS 업데이트: PROCESSING → SUCCESS/FAILED
     *
     * @return 업데이트된 행의 수
     */
    @Modifying
    @Query("""
        UPDATE PaymentProcess p
        SET p.status = :newStatus,
            p.approvalNo = :approvalNo,
            p.failReason = :failReason,
            p.processedAt = :processedAt
        WHERE p.id = :id
          AND p.status = :expectedStatus
    """)
    fun casUpdateToFinal(
        @Param("id") id: Long,
        @Param("expectedStatus") expectedStatus: PaymentProcessStatus,
        @Param("newStatus") newStatus: PaymentProcessStatus,
        @Param("approvalNo") approvalNo: String?,
        @Param("failReason") failReason: String?,
        @Param("processedAt") processedAt: LocalDateTime
    ): Int
}
