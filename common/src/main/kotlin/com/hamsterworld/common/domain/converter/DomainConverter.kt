package com.hamsterworld.common.domain.converter

interface DomainConverter<S, T> {
    fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean
    fun convert(source: S): T
}
