package com.hamsterworld.ecommerce.app.order.controller

import com.hamsterworld.ecommerce.app.order.request.OrderSearchRequest
import com.hamsterworld.ecommerce.app.order.response.OrderDetailResponse
import com.hamsterworld.ecommerce.app.order.response.OrderResponse
import com.hamsterworld.ecommerce.domain.order.service.OrderService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

/**
 * 주문 Admin Controller
 *
 * DEVELOPER role 전용 - 모든 주문 조회
 */
@Tag(name = "주문 Admin", description = "관리자용 주문 관리 API")
@RequestMapping("/api/admin/orders")
@RestController
@PreAuthorize("hasRole('DEVELOPER')")
class OrderAdminController(
    private val orderService: OrderService
) {

    @Operation(
        summary = "전체 주문 목록 조회",
        description = "관리자가 모든 사용자의 주문 내역을 조회합니다"
    )
    @GetMapping("/list")
    fun getAllOrdersList(
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<List<OrderResponse>> {
        val orders = orderService.getAllOrders(searchRequest)
        return ResponseEntity.ok(orders)
    }

    @Operation(
        summary = "전체 주문 페이지 조회",
        description = "관리자가 모든 사용자의 주문 내역을 페이징하여 조회합니다"
    )
    @GetMapping("/page")
    fun getAllOrdersPage(
        @ModelAttribute searchRequest: OrderSearchRequest
    ): ResponseEntity<Page<OrderResponse>> {
        val ordersPage = orderService.getAllOrdersPage(searchRequest)
        return ResponseEntity.ok(ordersPage)
    }

    @Operation(
        summary = "주문 상세 조회 (Admin)",
        description = "관리자가 특정 주문의 상세 정보를 조회합니다 (사용자 제약 없음)"
    )
    @GetMapping("/{orderPublicId}")
    fun getOrderDetailAdmin(
        @PathVariable orderPublicId: String
    ): ResponseEntity<OrderDetailResponse> {
        val orderDetail = orderService.getOrderDetailAdmin(orderPublicId)
        return ResponseEntity.ok(orderDetail)
    }
}
