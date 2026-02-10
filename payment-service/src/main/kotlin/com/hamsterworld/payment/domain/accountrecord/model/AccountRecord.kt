package com.hamsterworld.payment.domain.accountrecord.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

/**
 * AccountRecord - 계좌 변동 이력 (Event Sourcing)
 *
 * ProductRecord 패턴과 동일한 구조:
 * - ProductRecord.productId ↔ AccountRecord.accountId
 * - ProductRecord.stock (Int, delta) ↔ AccountRecord.amount (BigDecimal, delta)
 * - ProductRecord.reason ↔ AccountRecord.reason
 *
 * ## Event Sourcing
 * - amount는 변화량(delta)만 저장 (+적립, -사용, +환불)
 * - 모든 Record의 amount 합산 = 현재 잔액
 */
@Entity
@Table(
    name = "account_records",
    indexes = [
        Index(name = "idx_account_records_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_account_records_account_id", columnList = "account_id")
    ]
)
class AccountRecord(
    @Column(name = "account_id", nullable = false)
    var accountId: Long,

    @Column(nullable = false, precision = 15, scale = 3)
    var amount: BigDecimal,

    @Column(nullable = false)
    var reason: String
) : AbsDomain()
