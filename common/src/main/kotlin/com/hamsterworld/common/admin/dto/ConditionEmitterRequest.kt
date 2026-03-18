package com.hamsterworld.common.admin.dto
import java.math.BigDecimal
data class ConditionEmitterRequest(
    val rewardType: String? = null,
    val rewardAmount: Int? = null,
    val rewardContent: String? = null,
    val discountType: String? = null,
    val discountValue: BigDecimal? = null,
    val maxDiscountAmount: BigDecimal? = null
)
