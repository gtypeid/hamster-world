package com.hamsterworld.common.web

import com.hamsterworld.common.app.SortDirection
import com.querydsl.core.types.Order
import com.querydsl.core.types.OrderSpecifier
import com.querydsl.core.types.Path
import com.querydsl.core.types.dsl.*
import com.querydsl.jpa.JPQLQuery
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

object QuerydslExtension {

    fun match(path: StringPath, value: String?, exact: Boolean): BooleanExpression? {
        if (value == null) return null
        return if (exact) path.eq(value) else path.contains(value)
    }

    fun match(path: StringPath, value: String?): BooleanExpression? {
        if (value == null) return null
        return path.eq(value)
    }

    fun between(path: DateTimePath<LocalDateTime>, from: LocalDate?, to: LocalDate?): BooleanExpression? {
        if (from != null && to != null) {
            return path.between(from.atStartOfDay(), to.atTime(LocalTime.MAX))
        }
        return null
    }

    fun between(path: NumberPath<Long>, min: Long?, max: Long?): BooleanExpression? {
        return when {
            min != null && max != null -> path.between(min, max)
            min != null -> path.goe(min)
            max != null -> path.loe(max)
            else -> null
        }
    }

    fun between(path: NumberPath<BigDecimal>, min: BigDecimal?, max: BigDecimal?): BooleanExpression? {
        return when {
            min != null && max != null -> path.between(min, max)
            min != null -> path.goe(min)
            max != null -> path.loe(max)
            else -> null
        }
    }

    fun <T : Enum<T>> inOrNullSafe(path: EnumPath<T>, values: Set<T>?): BooleanExpression? {
        if (values.isNullOrEmpty()) return null
        return path.`in`(values)
    }

    fun inOrNullSafe(path: NumberPath<Long>, values: Set<Long>?): BooleanExpression? {
        if (values.isNullOrEmpty()) return null
        return path.`in`(values)
    }

    fun inOrNullSafe(path: StringPath, values: Set<String>?): BooleanExpression? {
        if (values.isNullOrEmpty()) return null
        return path.`in`(values)
    }

    fun eqOrNull(path: NumberPath<Long>, value: Long?): BooleanExpression? {
        if (value == null) return null
        return path.eq(value)
    }

    fun eqOrNull(path: StringPath, value: String?): BooleanExpression? {
        if (value == null) return null
        return path.eq(value)
    }

    fun <T : Enum<T>> eqOrNull(path: EnumPath<T>, value: T?): BooleanExpression? {
        if (value == null) return null
        return path.eq(value)
    }

    fun <T> applySorts(query: JPQLQuery<T>, path: Path<LocalDateTime>, sort: SortDirection): JPQLQuery<T> {
        val orderSpecifier = when (sort) {
            SortDirection.ASC -> OrderSpecifier(Order.ASC, path)
            SortDirection.DESC -> OrderSpecifier(Order.DESC, path)
        }
        return query.orderBy(orderSpecifier)
    }
}
