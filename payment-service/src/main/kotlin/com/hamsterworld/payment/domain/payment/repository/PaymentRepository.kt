package com.hamsterworld.payment.domain.payment.repository

import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.eqOrNull
import com.hamsterworld.common.web.QuerydslExtension.inOrNullSafe
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.payment.domain.payment.dto.PaymentSearchRequest
import com.hamsterworld.payment.domain.payment.model.Payment
import com.hamsterworld.payment.domain.payment.model.QPayment.payment
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import com.hamsterworld.payment.app.payment.response.PaymentResponse

@Repository
class PaymentRepository(
    private val paymentJpaRepository: PaymentJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(payment: Payment): Payment {
        return paymentJpaRepository.save(payment)
    }

    fun findById(id: Long): Payment {
        return paymentJpaRepository.findById(id)
            .orElseThrow {
                CustomRuntimeException("Payment를 찾을 수 없습니다. ID: $id")
            }
    }

    fun findByPublicId(publicId: String): Payment {
        return paymentJpaRepository.findByPublicId(publicId)
            .orElseThrow {
                CustomRuntimeException("Payment를 찾을 수 없습니다. Public ID: $publicId")
            }
    }

    fun findByOrderPublicId(orderPublicId: String): List<Payment> {
        return paymentJpaRepository.findByOrderPublicId(orderPublicId)
    }

    fun findByProcessPublicId(processPublicId: String): Payment? {
        return paymentJpaRepository.findByProcessPublicId(processPublicId).orElse(null)
    }

    fun findByPgTransaction(pgTransaction: String): Payment? {
        return paymentJpaRepository.findByPgTransaction(pgTransaction).orElse(null)
    }

    fun findByGatewayPaymentPublicId(gatewayPaymentPublicId: String): Payment? {
        return paymentJpaRepository.findByGatewayPaymentPublicId(gatewayPaymentPublicId).orElse(null)
    }

    fun findByIds(ids: Set<Long>): Map<Long, String> {
        if (ids.isEmpty()) return emptyMap()

        return jpaQueryFactory
            .select(payment.id, payment.publicId)
            .from(payment)
            .where(payment.id.`in`(ids))
            .fetch()
            .associate { tuple ->
                tuple.get(payment.id)!! to tuple.get(payment.publicId)!!
            }
    }

    fun findAll(search: PaymentSearchRequest): List<Payment> {
        val query = baseQuery(search)
        return applySorts(query, payment.createdAt, search.sort)
            .fetch()
    }

    fun findAllPage(search: PaymentSearchRequest): Page<Payment> {
        val baseQuery = baseQuery(search)

        // Count query
        val total = jpaQueryFactory
            .select(payment.count())
            .from(payment)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val payments = applySorts(pagedQuery, payment.createdAt, search.sort)
            .fetch()

        return PageImpl(payments, PageRequest.of(search.page, search.size), total)
    }

    /**
     * Payment 검색 (Response 형태로 반환)
     */
    fun findAllWithOriginPublicIds(search: PaymentSearchRequest): List<PaymentResponse> {
        val payments = findAll(search)
        val originPaymentPublicIdMap = buildOriginPaymentPublicIdMap(payments)

        return payments.map { payment ->
            PaymentResponse.from(
                payment,
                payment.originPaymentId?.let { originPaymentPublicIdMap[it] }
            )
        }
    }

    /**
     * Payment 검색 (Page, Response 형태로 반환)
     */
    fun findAllPageWithOriginPublicIds(search: PaymentSearchRequest): Page<PaymentResponse> {
        val paymentsPage = findAllPage(search)
        val originPaymentPublicIdMap = buildOriginPaymentPublicIdMap(paymentsPage.content)

        val content = paymentsPage.content.map { payment ->
            PaymentResponse.from(
                payment,
                payment.originPaymentId?.let { originPaymentPublicIdMap[it] }
            )
        }

        return PageImpl(content, paymentsPage.pageable, paymentsPage.totalElements)
    }

    private fun buildOriginPaymentPublicIdMap(payments: List<Payment>): Map<Long, String> {
        val originPaymentIds = payments
            .mapNotNull { it.originPaymentId }
            .toSet()

        if (originPaymentIds.isEmpty()) return emptyMap()

        return findByIds(originPaymentIds)
    }

    private fun baseQuery(
        search: PaymentSearchRequest
    ): JPQLQuery<Payment> {
        return jpaQueryFactory
            .selectFrom(payment)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(
        search: PaymentSearchRequest
    ): List<BooleanExpression> {
        return listOfNotNull(
            between(payment.createdAt, search.from, search.to),
            inOrNullSafe(payment.publicId, search.publicIds),
            eqOrNull(payment.orderPublicId, search.orderPublicId),
            eqOrNull(payment.processPublicId, search.processPublicId),
            eqOrNull(payment.gatewayPaymentPublicId, search.gatewayPaymentPublicId),
            between(payment.amount, search.minAmount, search.maxAmount),
            inOrNullSafe(payment.status, search.statuses)
        )
    }
}
