package com.hamsterworld.common.domain.condition
interface ConditionFilter<T> {
    fun matches(input: T): Boolean
    val filtersJson: String?
}
