package com.hamsterworld.hamsterpg.domain.payment.repository

import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface PaymentJpaRepository : JpaRepository<Payment, Long> {

    fun findByStatusAndCreatedAtBefore(
        status: PaymentStatus,
        createdAt: LocalDateTime
    ): List<Payment>

    fun findByStatusInAndNotificationStatus(
        statuses: List<PaymentStatus>,
        notificationStatus: NotificationStatus
    ): List<Payment>

    fun findByTid(tid: String): Payment?
}
