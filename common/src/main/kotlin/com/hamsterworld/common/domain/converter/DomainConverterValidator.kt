package com.hamsterworld.common.domain.converter

interface DomainConverterValidator<T> {
    fun validate(source: T)
}
