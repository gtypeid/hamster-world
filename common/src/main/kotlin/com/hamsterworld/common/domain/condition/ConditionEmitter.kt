package com.hamsterworld.common.domain.condition
interface ConditionEmitter<I, O> {
    fun emit(input: I): O
}
