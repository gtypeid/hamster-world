package com.hamsterworld.ecommerce.domain.cart.repository

import com.hamsterworld.ecommerce.app.cart.dto.CartItemWithProduct
import com.hamsterworld.ecommerce.app.cart.dto.CartWithItems
import com.hamsterworld.ecommerce.app.cart.request.CartItemSearchRequest
import com.hamsterworld.ecommerce.domain.cart.model.Cart
import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.eqOrNull
import com.hamsterworld.common.web.QuerydslExtension.inOrNullSafe
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.cartitem.model.QCartItem.cartItem
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class CartRepository(
    private val cartJpaRepository: CartJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val productService: ProductService
) {

    fun save(cart: Cart): Cart {
        return cartJpaRepository.save(cart)
    }

    fun update(cart: Cart): Cart {
        val copy = cart.copy()
        copy.modifiedAt = LocalDateTime.now()
        return cartJpaRepository.save(copy)
    }


    fun findById(id: Long): Cart {
        return cartJpaRepository.findById(id)
            .orElseThrow {
                CustomRuntimeException("장바구니를 찾을 수 없습니다. ID: $id")
            }
    }

    fun findByUserId(userId: Long): Cart? {
        return cartJpaRepository.findByUserId(userId)
    }

    fun findByUserIdOrThrow(userId: Long): Cart {
        return findByUserId(userId)
            ?: throw CustomRuntimeException("장바구니를 찾을 수 없습니다. User ID: $userId")
    }

    fun findByUserIdWithItems(userId: Long): CartWithItems {
        val cart = findByUserId(userId)
            ?: return CartWithItems(
                cart = Cart(userId = userId, name = "default"),
                items = emptyList()
            )

        return findCartWithItems(cart)
    }

    fun findByIdWithItems(cartId: Long): CartWithItems {
        val cart = findById(cartId)
        return findCartWithItems(cart)
    }

    fun findAll(search: CartItemSearchRequest): List<CartItemWithProduct> {
        val query = baseQuery(search)

        val cartItems = applySorts(query, cartItem.createdAt, search.sort)
            .fetch()

        return attachProducts(cartItems)
    }

    fun findAllPage(search: CartItemSearchRequest): Page<CartItemWithProduct> {
        val baseQuery = baseQuery(search)

        // Count query
        val total = jpaQueryFactory
            .select(cartItem.count())
            .from(cartItem)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val cartItems = applySorts(pagedQuery, cartItem.createdAt, search.sort)
            .fetch()

        val content = attachProducts(cartItems)

        return PageImpl(content, PageRequest.of(search.page, search.size), total)
    }

    fun findAllItemsByUserId(userId: Long, search: CartItemSearchRequest): List<CartItemWithProduct> {
        val cart = findByUserId(userId) ?: return emptyList()

        val searchWithCartId = search.copy(cartId = cart.id)

        val query = baseQuery(searchWithCartId)

        val cartItems = applySorts(query, cartItem.createdAt, search.sort)
            .fetch()

        return attachProducts(cartItems)
    }

    fun findAllItemsByUserIdPage(userId: Long, search: CartItemSearchRequest): Page<CartItemWithProduct> {
        val cart = findByUserId(userId)
            ?: return PageImpl(emptyList(), PageRequest.of(search.page, search.size), 0)

        val searchWithCartId = search.copy(cartId = cart.id)

        val baseQuery = baseQuery(searchWithCartId)

        // Count query
        val total = jpaQueryFactory
            .select(cartItem.count())
            .from(cartItem)
            .where(*searchListConditions(searchWithCartId).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val cartItems = applySorts(pagedQuery, cartItem.createdAt, search.sort)
            .fetch()

        val items = attachProducts(cartItems)

        return PageImpl(items, PageRequest.of(search.page, search.size), total)
    }

    private fun baseQuery(search: CartItemSearchRequest): JPQLQuery<CartItem> {
        return jpaQueryFactory
            .selectFrom(cartItem)
            // TODO: Product join 필요 - 외부 API 호출로 대체
            .where(
                *searchListConditions(search).toTypedArray()
            )
    }

    private fun searchListConditions(search: CartItemSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            eqOrNull(cartItem.cartId, search.cartId),
            between(cartItem.createdAt, search.from, search.to),
            inOrNullSafe(cartItem.publicId, search.publicIds)
            // Note: Product 관련 필터링(productPublicIds, productCategories, productName)은
            // CartItem 조회 후 attachProducts()에서 Product를 조인하여 필터링 가능
        )
    }

    private fun findCartWithItems(cart: Cart): CartWithItems {
        val items = findCartItems(cart.id!!)

        return CartWithItems(
            cart = cart,
            items = items
        )
    }

    private fun findCartItems(cartId: Long): List<CartItemWithProduct> {
        val cartItems = jpaQueryFactory
            .selectFrom(cartItem)
            .where(cartItem.cartId.eq(cartId))
            .fetch()

        return attachProducts(cartItems)
    }

    private fun attachProducts(cartItems: List<CartItem>): List<CartItemWithProduct> {
        if (cartItems.isEmpty()) {
            return emptyList()
        }

        // N+1 방지: ProductService를 통해 Product 정보 일괄 조회 (IN 쿼리)
        val productIds = cartItems.map { it.productId }.distinct()
        val products = productService.getProductsByIds(productIds)

        return cartItems.mapNotNull { cartItem ->
            val product = products[cartItem.productId]
            if (product != null) {
                CartItemWithProduct(
                    cartItem = cartItem,
                    product = product
                )
            } else {
                null // Product가 없는 CartItem은 제외 (삭제된 상품 등)
            }
        }
    }
}
