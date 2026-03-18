package com.hamsterworld.hamsterpg.domain.payment.repository

import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import org.springframework.data.jpa.repository.JpaRepository

interface PaymentJpaRepository : JpaRepository<Payment, Long> {

    fun findByTid(tid: String): Payment?
}
