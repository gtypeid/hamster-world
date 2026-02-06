package com.hamsterworld.ecommerce.domain.merchant.model

import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.math.BigDecimal

/**
 * 정산 정보 (Value Object)
 *
 * Merchant 엔티티에 임베드되어 사용
 */
@Embeddable
data class SettlementInfo(
    @Column(name = "bank_name", nullable = false)
    var bankName: String,  // 은행명 *

    @Column(name = "account_number", nullable = false)
    var accountNumber: String,  // 계좌번호 *

    @Column(name = "account_holder", nullable = false)
    var accountHolder: String,  // 예금주 *

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_cycle", nullable = false)
    var settlementCycle: SettlementCycle = SettlementCycle.WEEKLY,  // 정산 주기

    @Column(name = "platform_commission_rate", nullable = false, precision = 5, scale = 2)
    var platformCommissionRate: BigDecimal = BigDecimal("3.5")  // 플랫폼 수수료율 (%)
) {
    constructor() : this("", "", "", SettlementCycle.WEEKLY, BigDecimal("3.5"))
}
