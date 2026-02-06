package com.hamsterworld.ecommerce.domain.order.repository

import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.ecommerce.app.order.dto.OrderWithItems
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.event.OrderCreatedEvent
import com.hamsterworld.ecommerce.domain.order.event.OrderItemDto
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.order.model.QOrder.order as qOrder
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.orderitem.repository.OrderItemJpaRepository
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Repository
class OrderRepository(
    private val orderJpaRepository: OrderJpaRepository,
    private val orderItemJpaRepository: OrderItemJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val userRepository: com.hamsterworld.ecommerce.domain.user.repository.UserRepository
) {
    private val log = LoggerFactory.getLogger(OrderRepository::class.java)

    /**
     * Order + OrderItems 저장 및 OrderCreatedEvent 발행
     *
     * REQUIRES_NEW: 별도 트랜잭션으로 항상 커밋
     * 1. Order 저장 → PK 할당
     * 2. OrderItem들에 Order PK 매핑 후 저장
     * 3. Order에 이벤트 등록
     * 4. Order 다시 저장 → 이벤트 자동 발행
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun saveOrderRecord(orderWithItems: OrderWithItems): OrderWithItems {
        // 1. Order 저장 (PK 할당)
        var order: Order = orderWithItems.order

        // orderNumber 자동 생성 (없는 경우)
        if (order.orderNumber == null) {
            order.orderNumber = generateOrderNumber()
            log.debug("[orderNumber 자동 생성] orderNumber={}", order.orderNumber)
        }

        var savedOrder: Order = orderJpaRepository.save(order)

        // 2. OrderItem에 Order PK 매핑 후 저장
        val itemEntities: List<OrderItem> = orderWithItems.items.map { item ->
            item.copy(orderId = savedOrder.id!!)
        }
        val savedItems: List<OrderItem> = orderItemJpaRepository.saveAll(itemEntities)

        // 3. OrderCreatedEvent 등록
        // userId(Long) → userPublicId(String) 변환
        val user = userRepository.findById(savedOrder.userId!!)
        savedOrder = savedOrder.publishCreatedEvent(
            OrderCreatedEvent(
                orderPublicId = savedOrder.publicId,  // Order의 Public ID 사용
                userPublicId = user.publicId,         // User의 Public ID 사용
                orderNumber = savedOrder.orderNumber!!,
                totalPrice = savedOrder.price!!,
                items = savedItems.map { item ->
                    OrderItemDto(
                        productPublicId = item.productPublicId!!,  // Product의 Public ID 사용
                        quantity = item.quantity!!,
                        price = item.price!!
                    )
                }
            )
        )

        // 4. Order 다시 저장 → 이벤트 자동 발행
        savedOrder = orderJpaRepository.save(savedOrder)

        log.info(
            "[주문 생성 완료] orderId={}, userId={}, orderNumber={}, totalPrice={}, items={}개",
            savedOrder.id, savedOrder.userId, savedOrder.orderNumber, savedOrder.price, savedItems.size
        )

        return OrderWithItems(
            order = savedOrder,
            items = savedItems
        )
    }

    fun save(orderWithItems: OrderWithItems): OrderWithItems {
        val order: Order = orderWithItems.order
        val savedOrder: Order = orderJpaRepository.save(order)

        val itemEntities: List<OrderItem> = orderWithItems.items.map { item ->
            item.copy(orderId = savedOrder.id!!)
        }
        val savedItems: List<OrderItem> = orderItemJpaRepository.saveAll(itemEntities)

        return OrderWithItems(
            order = savedOrder,
            items = savedItems
        )
    }

    fun update(order: Order): Order {
        val copy = order.copy()
        copy.modifiedAt = LocalDateTime.now()
        return orderJpaRepository.save(copy)
    }

    fun casUpdateStatus(order: Order, newStatus: OrderStatus): Boolean {
        val currentStatus = order.status

        if (!currentStatus.canTransitionTo(newStatus)) {
            throw CustomRuntimeException("전환 불가 상태: $currentStatus -> $newStatus")
        }

        val updated = jpaQueryFactory
            .update(qOrder)
            .set(qOrder.status, newStatus)
            .set(qOrder.modifiedAt, LocalDateTime.now())
            .where(
                qOrder.id.eq(order.id),
                qOrder.status.eq(currentStatus)
            )
            .execute()

        if (updated > 0) {
            order.status = newStatus
            orderJpaRepository.save(order)
            return true
        } else {
            return false
        }
    }

    fun findById(id: Long): Order {
        return orderJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("주문을 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): Order {
        return jpaQueryFactory
            .selectFrom(qOrder)
            .where(qOrder.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("주문을 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findByIdWithItems(id: Long): OrderWithItems {
        val order = findById(id)
        val itemEntities = orderItemJpaRepository.findByOrderId(id)

        return OrderWithItems(
            order = order,
            items = itemEntities
        )
    }

    fun findByUserId(userId: Long): List<Order> {
        return orderJpaRepository.findByUserId(userId)
    }

    /**
     * 사용자 주문 검색 (필터링)
     *
     * 일반 사용자가 자신의 주문 내역을 조회
     */
    fun searchUserOrders(
        userId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC
    ): List<Order> {
        val query = baseUserOrderQuery(userId, status, from, to)

        return QuerydslExtension.applySorts(query, qOrder.createdAt, sort)
            .fetch()
    }

    /**
     * 사용자 주문 검색 (페이징)
     *
     * 일반 사용자가 자신의 주문 내역을 페이징하여 조회
     */
    fun searchUserOrdersPage(
        userId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<Order> {
        val baseQuery = baseUserOrderQuery(userId, status, from, to)

        // Count query
        val total = jpaQueryFactory
            .select(qOrder.count())
            .from(qOrder)
            .where(*searchUserOrderConditions(userId, status, from, to).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qOrder.createdAt, sort)
            .fetch()

        return PageImpl(
            entities,
            PageRequest.of(page, size),
            total
        )
    }

    /**
     * 판매자 주문 검색 (필터링)
     *
     * 판매자의 상품이 포함된 주문 조회
     * - OrderItem → Product → Merchant 연결로 필터링
     */
    fun searchMerchantOrders(
        merchantId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC
    ): List<Order> {
        val query = baseMerchantOrderQuery(merchantId, status, from, to)

        return QuerydslExtension.applySorts(query, qOrder.createdAt, sort)
            .fetch()
    }

    /**
     * 판매자 주문 검색 (페이징)
     *
     * 판매자의 상품이 포함된 주문 조회 (페이징)
     * - OrderItem → Product → Merchant 연결로 필터링
     */
    fun searchMerchantOrdersPage(
        merchantId: Long,
        status: OrderStatus?,
        from: java.time.LocalDate?,
        to: java.time.LocalDate?,
        sort: com.hamsterworld.common.app.SortDirection = com.hamsterworld.common.app.SortDirection.DESC,
        page: Int,
        size: Int
    ): org.springframework.data.domain.Page<Order> {
        val qOrderItem = com.hamsterworld.ecommerce.domain.orderitem.model.QOrderItem.orderItem
        val qProduct = com.hamsterworld.ecommerce.domain.product.model.QProduct.product

        val baseQuery = baseMerchantOrderQuery(merchantId, status, from, to)

        // Count query - use countDistinct for merchant orders due to join
        val total = jpaQueryFactory
            .select(qOrder.countDistinct())
            .from(qOrder)
            .innerJoin(qOrderItem).on(qOrderItem.orderId.eq(qOrder.id))
            .innerJoin(qProduct).on(qProduct.id.eq(qOrderItem.productId))
            .where(*searchMerchantOrderConditions(merchantId, status, from, to).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qOrder.createdAt, sort)
            .fetch()

        return org.springframework.data.domain.PageImpl(
            entities,
            org.springframework.data.domain.PageRequest.of(page, size),
            total
        )
    }

    private fun baseUserOrderQuery(
        userId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): JPAQuery<Order> {
        return jpaQueryFactory
            .selectFrom(qOrder)
            .where(*searchUserOrderConditions(userId, status, from, to).toTypedArray())
    }

    private fun baseMerchantOrderQuery(
        merchantId: Long,
        status: OrderStatus?,
        from: java.time.LocalDate?,
        to: java.time.LocalDate?
    ): com.querydsl.jpa.impl.JPAQuery<Order> {
        val qOrderItem = com.hamsterworld.ecommerce.domain.orderitem.model.QOrderItem.orderItem
        val qProduct = com.hamsterworld.ecommerce.domain.product.model.QProduct.product

        return jpaQueryFactory
            .selectDistinct(qOrder)
            .from(qOrder)
            .innerJoin(qOrderItem).on(qOrderItem.orderId.eq(qOrder.id))
            .innerJoin(qProduct).on(qProduct.id.eq(qOrderItem.productId))
            .where(*searchMerchantOrderConditions(merchantId, status, from, to).toTypedArray())
    }

    private fun searchUserOrderConditions(
        userId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): List<BooleanExpression> {
        return listOfNotNull(
            qOrder.userId.eq(userId),
            QuerydslExtension.eqOrNull(qOrder.status, status),
            QuerydslExtension.between(qOrder.createdAt, from, to)
        )
    }

    private fun searchMerchantOrderConditions(
        merchantId: Long,
        status: OrderStatus?,
        from: java.time.LocalDate?,
        to: java.time.LocalDate?
    ): List<BooleanExpression> {
        val qProduct = com.hamsterworld.ecommerce.domain.product.model.QProduct.product

        return listOfNotNull(
            QuerydslExtension.eqOrNull(qProduct.merchantId, merchantId),
            QuerydslExtension.eqOrNull(qOrder.status, status),
            QuerydslExtension.between(qOrder.createdAt, from, to)
        )
    }

    /**
     * 전체 주문 검색 (Admin용 - 필터링)
     *
     * 관리자가 모든 사용자의 주문 내역을 조회
     */
    fun searchAllOrders(
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC
    ): List<Order> {
        val query = baseAllOrdersQuery(status, from, to)

        return QuerydslExtension.applySorts(query, qOrder.createdAt, sort)
            .fetch()
    }

    /**
     * 전체 주문 검색 (Admin용 - 페이징)
     *
     * 관리자가 모든 사용자의 주문 내역을 페이징하여 조회
     */
    fun searchAllOrdersPage(
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<Order> {
        val baseQuery = baseAllOrdersQuery(status, from, to)

        // Count query
        val total = jpaQueryFactory
            .select(qOrder.count())
            .from(qOrder)
            .where(*searchAllOrdersConditions(status, from, to).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qOrder.createdAt, sort)
            .fetch()

        return PageImpl(
            entities,
            PageRequest.of(page, size),
            total
        )
    }

    private fun baseAllOrdersQuery(
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): JPAQuery<Order> {
        return jpaQueryFactory
            .selectFrom(qOrder)
            .where(*searchAllOrdersConditions(status, from, to).toTypedArray())
    }

    private fun searchAllOrdersConditions(
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.eqOrNull(qOrder.status, status),
            QuerydslExtension.between(qOrder.createdAt, from, to)
        )
    }

    /**
     * orderNumber 자동 생성
     *
     * **목적**: 고객용 주문번호 생성
     * **형식**: ORD_{TIMESTAMP}_{RANDOM}
     * **예시**: ORD_20260201123045_A1B2C3D4
     */
    private fun generateOrderNumber(): String {
        val timestamp = LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
        val random = java.util.UUID.randomUUID().toString()
            .substring(0, 8)
            .uppercase()
        return "ORD_${timestamp}_${random}"
    }
}
