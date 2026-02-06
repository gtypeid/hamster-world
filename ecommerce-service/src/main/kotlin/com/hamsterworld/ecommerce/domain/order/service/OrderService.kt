package com.hamsterworld.ecommerce.domain.order.service

import com.hamsterworld.ecommerce.app.cart.dto.CartWithItems
import com.hamsterworld.ecommerce.app.cart.dto.CartWithItemsResponse
import com.hamsterworld.ecommerce.app.order.dto.OrderWithItems
import com.hamsterworld.ecommerce.app.order.request.OrderSearchRequest
import com.hamsterworld.ecommerce.app.order.response.*
import com.hamsterworld.ecommerce.domain.cart.service.CartService
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.user.model.User
import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import com.hamsterworld.ecommerce.domain.orderitem.repository.OrderItemRepository
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class OrderService(
    private val userRepository: UserRepository,
    private val cartService: CartService,
    private val converterAdapter: DomainConverterAdapter,
    private val orderRepository: OrderRepository,
    private val orderItemRepository: OrderItemRepository,
    private val productRepository: ProductRepository,
    private val merchantRepository: MerchantRepository
) {

    @Transactional
    fun createOrder(userId: Long): OrderWithItems {
        val user: User = userRepository.findById(userId)
        val cartResponse: CartWithItemsResponse = cartService.getCart(userId)

        // CartWithItemsResponse를 내부 처리용 CartWithItems로 변환
        val cart: CartWithItems = cartService.getCartInternal(userId)

        // 카트 내역을 오더로 전환
        val order: OrderWithItems = converterAdapter.convert(cart, OrderWithItems::class.java)
        val savedOrder: OrderWithItems = orderRepository.saveOrderRecord(order)

        // 주문 생성 후 카트 비우기
        cartService.clearCart(userId)

        return savedOrder
    }

    @Transactional
    fun cancelOrder(orderId: Long, userId: Long): OrderWithItems {
        val orderWithItems = orderRepository.findByIdWithItems(orderId)
        val order = orderWithItems.order

        if (order.userId != userId) {
            throw CustomRuntimeException("대상 유저가 아닙니다")
        }

        // TODO: 결제 취소 요청은 cash-gateway-service로 위임 (이벤트 발행 또는 API 호출)

        return orderWithItems
    }

    /**
     * 내 주문 목록 조회 (일반 사용자)
     */
    @Transactional(readOnly = true)
    fun getMyOrders(userId: Long, searchRequest: OrderSearchRequest): List<OrderResponse> {
        val user = userRepository.findById(userId)
        val orders = orderRepository.searchUserOrders(
            userId = userId,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort
        )

        return orders.map { order ->
            val itemCount = orderItemRepository.findByOrderId(order.id!!).size
            OrderResponse.from(order, user.publicId, itemCount)
        }
    }

    /**
     * 내 주문 페이지 조회 (일반 사용자)
     */
    @Transactional(readOnly = true)
    fun getMyOrdersPage(userId: Long, searchRequest: OrderSearchRequest): org.springframework.data.domain.Page<OrderResponse> {
        val user = userRepository.findById(userId)
        val ordersPage = orderRepository.searchUserOrdersPage(
            userId = userId,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort,
            page = searchRequest.page,
            size = searchRequest.size
        )

        return ordersPage.map { order ->
            val itemCount = orderItemRepository.findByOrderId(order.id!!).size
            OrderResponse.from(order, user.publicId, itemCount)
        }
    }

    /**
     * 내 주문 상세 조회 (일반 사용자)
     */
    @Transactional(readOnly = true)
    fun getOrderDetail(orderPublicId: String, userId: Long): OrderDetailResponse {
        val user = userRepository.findById(userId)
        val order = orderRepository.findByPublicId(orderPublicId)

        // 권한 체크: 본인 주문만 조회 가능
        if (order.userId != userId) {
            throw CustomRuntimeException("본인의 주문만 조회할 수 있습니다")
        }

        val orderItems = orderItemRepository.findByOrderId(order.id!!)

        // Batch 조회로 N+1 방지
        val productIds = orderItems.map { it.productId!! }.distinct()
        val products = productRepository.findByIds(productIds).associateBy { it.id!! }

        val itemResponses = orderItems.map { item ->
            val product = products[item.productId]
                ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${item.productId}")
            OrderItemResponse.from(item, product)
        }

        return OrderDetailResponse.from(order, user.publicId, itemResponses)
    }

    /**
     * 머천트 주문 목록 조회
     */
    @Transactional(readOnly = true)
    fun getMerchantOrders(userId: Long, searchRequest: OrderSearchRequest): List<MerchantOrderResponse> {
        val user = userRepository.findById(userId)

        // 머천트 확인
        val merchant = merchantRepository.findByUserId(userId)
            ?: throw CustomRuntimeException("머천트 정보를 찾을 수 없습니다")

        val orders = orderRepository.searchMerchantOrders(
            merchantId = merchant.id!!,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort
        )

        return orders.map { order ->
            // 해당 주문에서 내 상품만 필터링
            val allOrderItems = orderItemRepository.findByOrderId(order.id!!)
            val productIds = allOrderItems.map { it.productId!! }.distinct()
            val products = productRepository.findByIds(productIds).associateBy { it.id!! }

            val myItems = allOrderItems.filter { item ->
                val product = products[item.productId]
                product?.merchantId == merchant.id
            }

            val myItemsPrice = myItems.sumOf { it.price ?: BigDecimal.ZERO }
            val myItemCount = myItems.size

            // 구매자 Public ID 조회
            val buyer = userRepository.findById(order.userId!!)

            MerchantOrderResponse.from(order, buyer.publicId, myItemsPrice, myItemCount)
        }
    }

    /**
     * 머천트 주문 페이지 조회
     */
    @Transactional(readOnly = true)
    fun getMerchantOrdersPage(userId: Long, searchRequest: OrderSearchRequest): org.springframework.data.domain.Page<MerchantOrderResponse> {
        val user = userRepository.findById(userId)

        // 머천트 확인
        val merchant = merchantRepository.findByUserId(userId)
            ?: throw CustomRuntimeException("머천트 정보를 찾을 수 없습니다")

        val ordersPage = orderRepository.searchMerchantOrdersPage(
            merchantId = merchant.id!!,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort,
            page = searchRequest.page,
            size = searchRequest.size
        )

        return ordersPage.map { order ->
            // 해당 주문에서 내 상품만 필터링
            val allOrderItems = orderItemRepository.findByOrderId(order.id!!)
            val productIds = allOrderItems.map { it.productId!! }.distinct()
            val products = productRepository.findByIds(productIds).associateBy { it.id!! }

            val myItems = allOrderItems.filter { item ->
                val product = products[item.productId]
                product?.merchantId == merchant.id
            }

            val myItemsPrice = myItems.sumOf { it.price ?: BigDecimal.ZERO }
            val myItemCount = myItems.size

            // 구매자 Public ID 조회
            val buyer = userRepository.findById(order.userId!!)

            MerchantOrderResponse.from(order, buyer.publicId, myItemsPrice, myItemCount)
        }
    }

    /**
     * 머천트 주문 상세 조회
     */
    @Transactional(readOnly = true)
    fun getMerchantOrderDetail(orderPublicId: String, userId: Long): MerchantOrderDetailResponse {
        val user = userRepository.findById(userId)

        // 머천트 확인
        val merchant = merchantRepository.findByUserId(userId)
            ?: throw CustomRuntimeException("머천트 정보를 찾을 수 없습니다")

        val order = orderRepository.findByPublicId(orderPublicId)
        val allOrderItems = orderItemRepository.findByOrderId(order.id!!)

        // Batch 조회로 N+1 방지
        val productIds = allOrderItems.map { it.productId!! }.distinct()
        val products = productRepository.findByIds(productIds).associateBy { it.id!! }

        // 내 상품만 필터링
        val myItems = allOrderItems.filter { item ->
            val product = products[item.productId]
            product?.merchantId == merchant.id
        }

        if (myItems.isEmpty()) {
            throw CustomRuntimeException("해당 주문에 머천트의 상품이 포함되어 있지 않습니다")
        }

        val myItemResponses = myItems.map { item ->
            val product = products[item.productId]
                ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${item.productId}")
            OrderItemResponse.from(item, product)
        }

        // 구매자 Public ID 조회
        val buyer = userRepository.findById(order.userId!!)

        return MerchantOrderDetailResponse.from(order, buyer.publicId, myItemResponses)
    }

    /**
     * 전체 주문 목록 조회 (Admin용)
     */
    @Transactional(readOnly = true)
    fun getAllOrders(searchRequest: OrderSearchRequest): List<OrderResponse> {
        val orders = orderRepository.searchAllOrders(
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort
        )

        // Batch 조회로 N+1 방지
        val userIds = orders.map { it.userId!! }.distinct()
        val users = userRepository.findByIds(userIds).associateBy { it.id!! }

        return orders.map { order ->
            val user = users[order.userId]
                ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${order.userId}")
            val itemCount = orderItemRepository.findByOrderId(order.id!!).size
            OrderResponse.from(order, user.publicId, itemCount)
        }
    }

    /**
     * 전체 주문 페이지 조회 (Admin용)
     */
    @Transactional(readOnly = true)
    fun getAllOrdersPage(searchRequest: OrderSearchRequest): org.springframework.data.domain.Page<OrderResponse> {
        val ordersPage = orderRepository.searchAllOrdersPage(
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            sort = searchRequest.sort,
            page = searchRequest.page,
            size = searchRequest.size
        )

        // Batch 조회로 N+1 방지
        val userIds = ordersPage.content.map { it.userId!! }.distinct()
        val users = userRepository.findByIds(userIds).associateBy { it.id!! }

        return ordersPage.map { order ->
            val user = users[order.userId]
                ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${order.userId}")
            val itemCount = orderItemRepository.findByOrderId(order.id!!).size
            OrderResponse.from(order, user.publicId, itemCount)
        }
    }

    /**
     * 주문 상세 조회 (Admin용 - 사용자 제약 없음)
     */
    @Transactional(readOnly = true)
    fun getOrderDetailAdmin(orderPublicId: String): OrderDetailResponse {
        val order = orderRepository.findByPublicId(orderPublicId)
        val user = userRepository.findById(order.userId!!)
        val orderItems = orderItemRepository.findByOrderId(order.id!!)

        // Batch 조회로 N+1 방지
        val productIds = orderItems.map { it.productId!! }.distinct()
        val products = productRepository.findByIds(productIds).associateBy { it.id!! }

        val itemResponses = orderItems.map { item ->
            val product = products[item.productId]
                ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${item.productId}")
            OrderItemResponse.from(item, product)
        }

        return OrderDetailResponse.from(order, user.publicId, itemResponses)
    }
}
