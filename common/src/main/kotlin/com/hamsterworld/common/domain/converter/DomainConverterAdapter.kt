package com.hamsterworld.common.domain.converter

import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Component

@Component
class DomainConverterAdapter(
    private val converters: List<DomainConverter<*, *>>
) {

    @Suppress("UNCHECKED_CAST")
    fun <S : Any, T> convert(source: S, targetType: Class<T>): T {
        val sourceType = source::class.java

        val converter = converters
            .find { it.isSupport(sourceType, targetType) }
            ?.let { it as DomainConverter<S, T> }
            ?: throw CustomRuntimeException(
                "지원되는 컨버터 없음: ${sourceType.simpleName} → ${targetType.simpleName}"
            )

        return converter.convert(source)
    }
}
