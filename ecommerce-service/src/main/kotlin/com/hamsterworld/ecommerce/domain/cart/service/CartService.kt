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
    @Transactional(readOnly = true)
    fun getCartInternal(userId: Long): CartWithItems {
        return cartRepository.findByUserIdWithItems(userId)
    }
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
        val product = try {
            productService.getProductByPublicId(request.productPublicId)
        } catch (e: Exception) {
            throw CustomRuntimeException("상품을 찾을 수 없습니다. Product Public ID: ${request.productPublicId}")
        }
        if (product.isSoldOut) {
            throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
        }
        val existingItem = cartItemRepository.findByCartIdAndProductId(
            cart.id!!,
            product.id!!
        )
        if (existingItem != null) {
            val newQuantity = existingItem.quantity + request.quantity
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
            if (request.quantity > product.stock) {
                throw CustomRuntimeException(
                    "재고가 부족합니다. 요청 수량: ${request.quantity}, 재고: ${product.stock}"
                )
            }
            val newItem = CartItem(
                cartId = cart.id!!,
                productId = product.id!!,
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
        val product = try {
            productService.getProduct(item.productId)
        } catch (e: Exception) {
            throw CustomRuntimeException("상품을 찾을 수 없습니다. Product ID: ${item.productId}")
        }
        if (product.isSoldOut) {
            throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
        }
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
    @Transactional
    fun updateCartItems(userId: Long, request: CartItemsUpdateRequest): CartWithItemsResponse {
        val cart = getOrCreateCart(userId)
        cartItemRepository.deleteByCartId(cart.id!!)
        val groupedItems = request.items
            .groupBy { it.productPublicId }
            .mapValues { (_, items) -> items.sumOf { it.quantity } }
        groupedItems.forEach { (productPublicId, totalQuantity) ->
            val product = try {
                productService.getProductByPublicId(productPublicId)
            } catch (e: Exception) {
                throw CustomRuntimeException("상품을 찾을 수 없습니다. Product Public ID: $productPublicId")
            }
            if (product.isSoldOut) {
                throw CustomRuntimeException("품절된 상품입니다. Product: ${product.name}")
            }
            if (totalQuantity > product.stock) {
                throw CustomRuntimeException(
                    "재고가 부족합니다. Product: ${product.name}, 요청 수량: $totalQuantity, 재고: ${product.stock}"
                )
            }
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
