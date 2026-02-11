package com.hamsterworld.ecommerce.domain.cart.service

import com.hamsterworld.ecommerce.app.cart.dto.*
import com.hamsterworld.ecommerce.app.cart.request.CartItemAddRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemSearchRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemUpdateRequest
import com.hamsterworld.ecommerce.app.cart.request.CartItemsUpdateRequest
import com.hamsterworld.ecommerce.domain.cart.repository.CartRepository
import com.hamsterworld.ecommerce.domain.cartitem.repository.CartItemRepository
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.cart.model.Cart
import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CartService(
    private val cartRepository: CartRepository,
    private val cartItemRepository: CartItemRepository,
    private val productService: ProductService,
    private val userRepository: UserRepository
) {

    @Transactional
    fun getOrCreateCart(userId: Long): Cart {
        return cartRepository.findByUserId(userId)
            ?: run {
                val newCart = Cart(
                    userId = userId,
                    name = "default"
                )
                cartRepository.save(newCart)
            }
    }

    @Transactional(readOnly = true)
    fun getCart(userId: Long): CartWithItemsResponse {
        val cartWithItems = cartRepository.findByUserIdWithItems(userId)
        return toCartWithItemsResponse(userId, cartWithItems)
    }

    /**
     * 내부 처리용 CartWithItems 조회 (Domain 모델 그대로)
     * OrderService 등에서 변환 로직을 위해 사용
     */
    @Transactional(readOnly = true)
    fun getCartInternal(userId: Long): CartWithItems {
        return cartRepository.findByUserIdWithItems(userId)
    }

    /**
     * CartWithItems (Domain) → CartWithItemsResponse (DTO) 변환
     */
    private fun toCartWithItemsResponse(userId: Long, cartWithItems: CartWithItems): CartWithItemsResponse {
        val user = userRepository.findById(userId)

        val cartResponse = CartResponse.from(cartWithItems.cart, user.publicId)

        val itemResponses = cartWithItems.items.map { item ->
            val cartItemResponse = CartItemResponse.from(
                item.cartItem,
                cartWithItems.cart.publicId,
                item.product.publicId
            )
            val productResponse = ProductSimpleResponse.from(item.product)

            CartItemWithProductResponse(
                cartItem = cartItemResponse,
                product = productResponse
            )
        }

        return CartWithItemsResponse(
            cart = cartResponse,
            items = itemResponses
        )
    }

    @Transactional
    fun addItem(userId: Long, request: CartItemAddRequest): CartWithItemsResponse {
        val cart = getOrCreateCart(userId)

        // 1. Product 존재 여부 및 재고 확인 (캐싱된 Product 조회)
        // 진실의 원천은 Payment Service이지만, Ecommerce Service는 캐싱된 Product를 가지고 있음
        // 외부 API는 publicId (String)를 사용
        val product = try {
            productService.getProductByPublicId(request.productPublicId)
        } catch (e: Exception) {
            throw CustomRuntimeException("상품을 찾을 수 없습니다. Product Public ID: ${request.productPublicId}")
        }

        // 2. 재고 확인 (캐싱된 재고 기준)
        // Payment Service에서 재고 동기화를 통해 최신 상태 유지됨
        if (product.isSoldOut) {
            throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
        }

        val existingItem = cartItemRepository.findByCartIdAndProductId(
            cart.id!!,
            product.id!!  // Internal ID로 조회
        )

        if (existingItem != null) {
            // 기존 아이템이 있으면 수량 증가
            val newQuantity = existingItem.quantity + request.quantity

            // 3. 재고 수량 체크 (캐싱된 재고 기준)
            if (newQuantity > product.stock) {
                throw CustomRuntimeException(
                    "재고가 부족합니다. 요청 수량: $newQuantity, 재고: ${product.stock}"
                )
            }

            val updated = existingItem.copy(
                quantity = newQuantity
            )
            cartItemRepository.update(updated)
        } else {
            // 새 아이템 추가
            // 3. 재고 수량 체크 (캐싱된 재고 기준)
            if (request.quantity > product.stock) {
                throw CustomRuntimeException(
                    "재고가 부족합니다. 요청 수량: ${request.quantity}, 재고: ${product.stock}"
                )
            }

            val newItem = CartItem(
                cartId = cart.id!!,
                productId = product.id!!,  // Internal ID로 저장
                quantity = request.quantity
            )
            cartItemRepository.save(newItem)
        }

        val cartWithItems = cartRepository.findByUserIdWithItems(userId)
        return toCartWithItemsResponse(userId, cartWithItems)
    }

    @Transactional
    fun updateItemQuantity(userId: Long, itemId: Long, request: CartItemUpdateRequest): CartWithItemsResponse {
        val cart = getOrCreateCart(userId)
        val item = cartItemRepository.findById(itemId)

        if (item.cartId != cart.id) {
            throw CustomRuntimeException("해당 장바구니 아이템에 접근할 수 없습니다.")
        }

        // 1. Product 조회 및 재고 확인 (캐싱된 Product 조회)
        val product = try {
            productService.getProduct(item.productId)
        } catch (e: Exception) {
            throw CustomRuntimeException("상품을 찾을 수 없습니다. Product ID: ${item.productId}")
        }

        // 2. 재고 확인 (캐싱된 재고 기준)
        if (product.isSoldOut) {
            throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
        }

        // 3. 재고 수량 체크 (캐싱된 재고 기준)
        if (request.quantity > product.stock) {
            throw CustomRuntimeException(
                "재고가 부족합니다. 요청 수량: ${request.quantity}, 재고: ${product.stock}"
            )
        }

        val updated = item.copy(
            quantity = request.quantity
        )

        cartItemRepository.update(updated)

        val cartWithItems = cartRepository.findByUserIdWithItems(userId)
        return toCartWithItemsResponse(userId, cartWithItems)
    }

    @Transactional
    fun removeItem(userId: Long, itemId: Long) {
        val cart = getOrCreateCart(userId)
        val item = cartItemRepository.findById(itemId)

        if (item.cartId != cart.id) {
            throw CustomRuntimeException("해당 장바구니 아이템에 접근할 수 없습니다.")
        }

        cartItemRepository.deleteById(itemId)
    }

    @Transactional
    fun clearCart(userId: Long) {
        val cart = getOrCreateCart(userId)
        cartItemRepository.deleteByCartId(cart.id!!)
    }

    @Transactional(readOnly = true)
    fun getCartItemsList(userId: Long, search: CartItemSearchRequest): List<CartItemWithProductResponse> {
        val items = cartRepository.findAllItemsByUserId(userId, search)
        val user = userRepository.findById(userId)
        val cart = getOrCreateCart(userId)

        return items.map { item ->
            val cartItemResponse = CartItemResponse.from(
                item.cartItem,
                cart.publicId,
                item.product.publicId
            )
            val productResponse = ProductSimpleResponse.from(item.product)

            CartItemWithProductResponse(
                cartItem = cartItemResponse,
                product = productResponse
            )
        }
    }

    @Transactional(readOnly = true)
    fun getCartItemsPage(userId: Long, search: CartItemSearchRequest): Page<CartItemWithProductResponse> {
        val page = cartRepository.findAllItemsByUserIdPage(userId, search)
        val user = userRepository.findById(userId)
        val cart = getOrCreateCart(userId)

        return page.map { item ->
            val cartItemResponse = CartItemResponse.from(
                item.cartItem,
                cart.publicId,
                item.product.publicId
            )
            val productResponse = ProductSimpleResponse.from(item.product)

            CartItemWithProductResponse(
                cartItem = cartItemResponse,
                product = productResponse
            )
        }
    }

    /**
     * 장바구니 전체 설정 (덮어쓰기)
     *
     * - 기존 장바구니 아이템을 모두 삭제
     * - 요청된 아이템들로 새로 생성
     * - 빈 리스트를 보내면 장바구니 비우기와 동일
     */
    @Transactional
    fun updateCartItems(userId: Long, request: CartItemsUpdateRequest): CartWithItemsResponse {
        val cart = getOrCreateCart(userId)

        // 1. 기존 장바구니 아이템 모두 삭제
        cartItemRepository.deleteByCartId(cart.id!!)

        // 2. 요청된 아이템들을 productPublicId로 그룹핑하여 수량 합산
        val groupedItems = request.items
            .groupBy { it.productPublicId }
            .mapValues { (_, items) -> items.sumOf { it.quantity } }

        // 3. 그룹핑된 아이템들을 하나씩 추가
        groupedItems.forEach { (productPublicId, totalQuantity) ->
            // Product 존재 여부 및 재고 확인
            val product = try {
                productService.getProductByPublicId(productPublicId)
            } catch (e: Exception) {
                throw CustomRuntimeException("상품을 찾을 수 없습니다. Product Public ID: $productPublicId")
            }

            // 재고 확인
            if (product.isSoldOut) {
                throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
            }

            // 재고 수량 체크
            if (totalQuantity > product.stock) {
                throw CustomRuntimeException(
                    "재고가 부족합니다. Product: ${product.name}, 요청 수량: $totalQuantity, 재고: ${product.stock}"
                )
            }

            // CartItem 생성
            val newItem = CartItem(
                cartId = cart.id!!,
                productId = product.id!!,
                quantity = totalQuantity
            )
            cartItemRepository.save(newItem)
        }

        val cartWithItems = cartRepository.findByUserIdWithItems(userId)
        return toCartWithItemsResponse(userId, cartWithItems)
    }
}
