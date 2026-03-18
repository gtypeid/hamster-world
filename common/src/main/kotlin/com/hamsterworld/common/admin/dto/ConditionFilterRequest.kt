package com.hamsterworld.common.admin.dto
import java.math.BigDecimal
data class ConditionFilterRequest(
    val missionType: String? = null,
    val requirement: Int? = null,
    val minOrderAmount: BigDecimal? = null,
    val filtersJson: String? = null
)
