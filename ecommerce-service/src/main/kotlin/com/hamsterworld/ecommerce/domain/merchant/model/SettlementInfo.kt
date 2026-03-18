package com.hamsterworld.ecommerce.domain.merchant.model
import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.math.BigDecimal
@Embeddable
data class SettlementInfo(
    @Column(name = "bank_name", nullable = false)
    var bankName: String,
    @Column(name = "account_number", nullable = false)
    var accountNumber: String,
    @Column(name = "account_holder", nullable = false)
    var accountHolder: String,
    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_cycle", nullable = false)
    var settlementCycle: SettlementCycle = SettlementCycle.WEEKLY,
    @Column(name = "platform_commission_rate", nullable = false, precision = 5, scale = 2)
    var platformCommissionRate: BigDecimal = BigDecimal("3.5")
) {
    constructor() : this("", "", "", SettlementCycle.WEEKLY, BigDecimal("3.5"))
}
