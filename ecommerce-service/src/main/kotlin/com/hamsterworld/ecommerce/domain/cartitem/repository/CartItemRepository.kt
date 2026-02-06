package com.hamsterworld.ecommerce.domain.cartitem.repository

import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class CartItemRepository(
    private val cartItemJpaRepository: CartItemJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val entityManager: EntityManager
) {

    fun save(cartItem: CartItem): CartItem {
        return cartItemJpaRepository.save(cartItem)
    }

    fun update(cartItem: CartItem): CartItem {
        cartItem.modifiedAt = LocalDateTime.now()
        return cartItemJpaRepository.save(cartItem)
    }

    fun findById(id: Long): CartItem {
        return cartItemJpaRepository.findById(id)
            .orElseThrow {
                CustomRuntimeException("장바구니 아이템을 찾을 수 없습니다. ID: $id")
            }
    }

    fun findByCartId(cartId: Long): List<CartItem> {
        return cartItemJpaRepository.findByCartId(cartId)
    }

    fun findByCartIdAndProductId(cartId: Long, productId: Long): CartItem? {
        return cartItemJpaRepository.findByCartIdAndProductId(cartId, productId)
    }

    fun deleteById(id: Long) {
        cartItemJpaRepository.deleteById(id)
    }

    fun deleteByCartId(cartId: Long) {
        cartItemJpaRepository.deleteByCartId(cartId)
        // 즉시 flush하여 DELETE가 먼저 실행되도록 보장
        entityManager.flush()
    }
}
