package com.hamsterworld.hamsterpg.domain.payment.repository

import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.hamsterpg.app.payment.request.PaymentSearchRequest
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.model.QPayment.payment as qPayment
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

@Repository
class PaymentRepository(
    private val jpaRepository: PaymentJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun findByTid(tid: String): Payment {
        return jpaRepository.findByTid(tid)
            ?: throw CustomRuntimeException("Payment not found: tid=$tid")
    }

    fun findByTidOrNull(tid: String): Payment? {
        return jpaRepository.findByTid(tid)
    }

    fun save(model: Payment): Payment {
        return jpaRepository.save(model)
    }

    fun searchList(request: PaymentSearchRequest): List<Payment> {
        val query = baseQuery(request)
        return QuerydslExtension.applySorts(query, qPayment.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: PaymentSearchRequest): Page<Payment> {
        val total = jpaQueryFactory
            .select(qPayment.count())
            .from(qPayment)
            .where(*searchConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery(request)
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qPayment.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }

    private fun baseQuery(request: PaymentSearchRequest): com.querydsl.jpa.impl.JPAQuery<Payment> {
        return jpaQueryFactory
            .selectFrom(qPayment)
            .where(*searchConditions(request).toTypedArray())
    }

    private fun searchConditions(request: PaymentSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.match(qPayment.tid, request.tid, request.match),
            QuerydslExtension.match(qPayment.orderId, request.orderId, request.match),
            QuerydslExtension.eqOrNull(qPayment.status, request.status),
            QuerydslExtension.eqOrNull(qPayment.notificationStatus, request.notificationStatus),
            QuerydslExtension.inOrNullSafe(qPayment.publicId, request.publicIds),
            QuerydslExtension.between(qPayment.createdAt, request.from, request.to)
        )
    }
}
