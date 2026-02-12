package com.hamsterworld.ecommerce.app.order.controller

import com.hamsterworld.ecommerce.app.order.dto.OrderWithItems
import com.hamsterworld.ecommerce.app.order.request.CartOrderRequest
import com.hamsterworld.ecommerce.app.order.request.OrderSearchRequest
import com.hamsterworld.ecommerce.app.order.response.*
import com.hamsterworld.ecommerce.domain.order.service.OrderService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "주문")
@RequestMapping("/api/orders")
@RestController
class OrderController(
    private val orderService: OrderService
) {

    @Operation(summary = "장바구니 주문", description = "장바구니 → 주문 생성. 쿠폰 적용 시 userCouponPublicId 전달")
    @PostMapping
    fun cartOrder(
        @AuthenticationPrincipal user: User,
        @RequestBody(required = false) request: CartOrderRequest?
    ): ResponseEntity<OrderWithItems> {
        val order = orderService.createOrder(user.id!!, request?.userCouponPublicId)
        return ResponseEntity.ok(order)
    }

    @Operation(summary = "주문 취소")
    @PostMapping("/{orderId}/cancel")
    fun orderCancel(
        @PathVariable orderId: Long,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<OrderWithItems> {
        val order = orderService.cancelOrder(orderId, user.id!!)
        return ResponseEntity.ok(order)
    }

    @Operation(summary = "내 주문 목록 조회", description = "일반 사용자가 자신의 주문 내역을 조회합니다")
    @GetMapping("/list")
    fun getMyOrdersList(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<List<OrderResponse>> {
        val orders = orderService.getMyOrders(user.id!!, searchRequest)
        return ResponseEntity.ok(orders)
    }

    @Operation(summary = "내 주문 페이지 조회", description = "일반 사용자가 자신의 주문 내역을 페이징하여 조회합니다")
    @GetMapping("/page")
    fun getMyOrdersPage(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<org.springframework.data.domain.Page<OrderResponse>> {
        val ordersPage = orderService.getMyOrdersPage(user.id!!, searchRequest)
        return ResponseEntity.ok(ordersPage)
    }

    @Operation(summary = "내 주문 상세 조회", description = "일반 사용자가 자신의 특정 주문 상세 정보를 조회합니다")
    @GetMapping("/{orderPublicId}")
    fun getOrderDetail(
        @PathVariable orderPublicId: String,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<OrderDetailResponse> {
        val orderDetail = orderService.getOrderDetail(orderPublicId, user.id!!)
        return ResponseEntity.ok(orderDetail)
    }

    @Operation(summary = "머천트 주문 목록 조회", description = "머천트가 자신의 상품이 포함된 주문 내역을 조회합니다")
    @GetMapping("/merchant/list")
    fun getMerchantOrdersList(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<List<MerchantOrderResponse>> {
        val orders = orderService.getMerchantOrders(user.id!!, searchRequest)
        return ResponseEntity.ok(orders)
    }

    @Operation(summary = "머천트 주문 페이지 조회", description = "머천트가 자신의 상품이 포함된 주문 내역을 페이징하여 조회합니다")
    @GetMapping("/merchant/page")
    fun getMerchantOrdersPage(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<org.springframework.data.domain.Page<MerchantOrderResponse>> {
        val ordersPage = orderService.getMerchantOrdersPage(user.id!!, searchRequest)
        return ResponseEntity.ok(ordersPage)
    }

    @Operation(summary = "머천트 주문 상세 조회", description = "머천트가 특정 주문의 자신의 상품 상세 정보를 조회합니다")
    @GetMapping("/merchant/{orderPublicId}")
    fun getMerchantOrderDetail(
        @PathVariable orderPublicId: String,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<MerchantOrderDetailResponse> {
        val orderDetail = orderService.getMerchantOrderDetail(orderPublicId, user.id!!)
        return ResponseEntity.ok(orderDetail)
    }
}
