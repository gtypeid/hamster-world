package com.hamsterworld.hamsterpg.domain.paymentprocess.repository

import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PaymentProcessJpaRepository : JpaRepository<PaymentProcess, Long> {

    fun findByTid(tid: String): PaymentProcess?
}
