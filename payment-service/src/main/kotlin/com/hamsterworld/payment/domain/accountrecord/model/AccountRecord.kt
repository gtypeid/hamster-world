package com.hamsterworld.payment.domain.accountrecord.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

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
