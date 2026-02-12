package com.hamsterworld.ecommerce.app.cart.controller

import com.hamsterworld.ecommerce.app.cart.dto.CartItemWithProductResponse
import com.hamsterworld.ecommerce.app.cart.dto.CartWithItemsResponse
import com.hamsterworld.ecommerce.app.cart.request.CartItemAddRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemSearchRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemUpdateRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemsUpdateRequest
import com.hamsterworld.ecommerce.domain.cart.service.CartService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "장바구니")
@RequestMapping("/api/carts")
@RestController
class CartController(
    private val cartService: CartService
) {

    @Operation(
        summary = "장바구니 조회",
        description = "현재 사용자의 장바구니를 조회합니다"
    )
    @GetMapping
    fun getCart(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<CartWithItemsResponse> {
        val result = cartService.getCart(user.id!!)
        return ResponseEntity.ok(result)
    }

    @Operation(
        summary = "장바구니 전체 설정",
        description = """
            장바구니의 모든 아이템을 한번에 설정합니다.
            - 기존 아이템은 모두 삭제되고 요청된 아이템으로 대체됩니다
            - 빈 리스트를 보내면 장바구니가 비워집니다
            - 예: [{"productPublicId": "abc123", "quantity": 2}, {"productPublicId": "def456", "quantity": 1}]
        """
    )
    @PutMapping
    fun updateCartItems(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody request: CartItemsUpdateRequest
    ): ResponseEntity<CartWithItemsResponse> {
        val result = cartService.updateCartItems(user.id!!, request)
        return ResponseEntity.ok(result)
    }

    @Operation(
        summary = "장바구니 아이템 목록 조회",
        description = "장바구니 아이템을 검색 조건으로 조회합니다"
    )
    @GetMapping("/items/list")
    fun getCartItemsList(
        @AuthenticationPrincipal user: User,
        @ModelAttribute search: CartItemSearchRequest
    ): ResponseEntity<List<CartItemWithProductResponse>> {
        val result = cartService.getCartItemsList(user.id!!, search)
        return ResponseEntity.ok(result)
    }
}
