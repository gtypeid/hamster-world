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
import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponUsageRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.UserCouponRepository
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
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.ecommerce.domain.orderitem.model.QOrderItem
import com.hamsterworld.ecommerce.domain.product.model.QProduct
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import java.time.LocalDate
import java.time.LocalDateTime
@Repository
class OrderRepository(
    private val orderJpaRepository: OrderJpaRepository,
    private val orderItemJpaRepository: OrderItemJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val userRepository: UserRepository,
    private val productRepository: ProductRepository,
    private val merchantRepository: MerchantRepository,
    private val couponUsageRepository: CouponUsageRepository,
    private val userCouponRepository: UserCouponRepository
) {
    private val log = LoggerFactory.getLogger(OrderRepository::class.java)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun saveOrderRecord(orderWithItems: OrderWithItems): OrderWithItems {
        var order: Order = orderWithItems.order
        if (order.orderNumber == null) {
            order.orderNumber = generateOrderNumber()
            log.debug("[orderNumber 자동 생성] orderNumber={}", order.orderNumber)
        }
        var savedOrder: Order = orderJpaRepository.save(order)
        val itemEntities: List<OrderItem> = orderWithItems.items.map { item ->
            item.copy(orderId = savedOrder.id!!)
        }
        val savedItems: List<OrderItem> = orderItemJpaRepository.saveAll(itemEntities)
        orderWithItems.couponApply?.let { couponApply ->
            val couponUsage = CouponUsage.create(
                userId = couponApply.userId,
                couponPolicyId = couponApply.couponPolicyId,
                couponCode = couponApply.couponCode,
                orderId = savedOrder.id!!,
                orderPublicId = savedOrder.publicId,
                discountAmount = couponApply.discountAmount
            )
            couponUsageRepository.save(couponUsage)
            val userCoupon = userCouponRepository.findById(couponApply.userCouponId)
            val used = userCoupon.markUsed()
            userCouponRepository.save(used)
            log.info(
                "[쿠폰 사용 처리] orderId={}, couponCode={}, discountAmount={}, userCouponId={}",
                savedOrder.id, couponApply.couponCode, couponApply.discountAmount, couponApply.userCouponId
            )
        }
        val user = userRepository.findById(savedOrder.userId!!)
        val productIds = savedItems.map { it.productId!! }.distinct()
        val productMap = productRepository.findByIds(productIds).associateBy { it.id!! }
        val merchantIds = savedItems.map { it.merchantId!! }.distinct()
        val merchantMap = merchantRepository.findByIds(merchantIds).associateBy { it.id!! }
        savedOrder = savedOrder.publishCreatedEvent(
            OrderCreatedEvent(
                orderPublicId = savedOrder.publicId,
                userPublicId = user.publicId,
                userKeycloakId = user.keycloakUserId,
                orderNumber = savedOrder.orderNumber!!,
                totalPrice = savedOrder.price!!,
                items = savedItems.map { item ->
                    val product = productMap[item.productId!!]
                        ?: throw CustomRuntimeException("Product를 찾을 수 없습니다. ID: ${item.productId}")
                    val merchant = merchantMap[item.merchantId!!]
                        ?: throw CustomRuntimeException("Merchant를 찾을 수 없습니다. ID: ${item.merchantId}")
                    OrderItemDto(
                        productPublicId = product.publicId,
                        merchantPublicId = merchant.publicId,
                        quantity = item.quantity!!,
                        price = item.price!!
                    )
                }
            )
        )
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
    fun searchMerchantOrdersPage(
        merchantId: Long,
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<Order> {
        val qOrderItem = QOrderItem.orderItem
        val qProduct = QProduct.product
        val baseQuery = baseMerchantOrderQuery(merchantId, status, from, to)
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
        return PageImpl(
            entities,
            PageRequest.of(page, size),
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
        from: LocalDate?,
        to: LocalDate?
    ): JPAQuery<Order> {
        val qOrderItem = QOrderItem.orderItem
        val qProduct = QProduct.product
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
        from: LocalDate?,
        to: LocalDate?
    ): List<BooleanExpression> {
        val qProduct = QProduct.product
        return listOfNotNull(
            QuerydslExtension.eqOrNull(qProduct.merchantId, merchantId),
            QuerydslExtension.eqOrNull(qOrder.status, status),
            QuerydslExtension.between(qOrder.createdAt, from, to)
        )
    }
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
    fun searchAllOrdersPage(
        status: OrderStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<Order> {
        val baseQuery = baseAllOrdersQuery(status, from, to)
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
    private fun generateOrderNumber(): String {
        val timestamp = LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
        val random = java.util.UUID.randomUUID().toString()
            .substring(0, 8)
            .uppercase()
        return "ORD_${timestamp}_${random}"
    }
}
