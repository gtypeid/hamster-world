package com.hamsterworld.ecommerce.domain.merchant.repository

import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import org.springframework.data.jpa.repository.JpaRepository

interface MerchantJpaRepository : JpaRepository<Merchant, Long> {
    fun findByUserId(userId: Long): Merchant?
    fun findByPublicId(publicId: String): Merchant?
    fun findByCashGatewayMid(cashGatewayMid: String): Merchant?
}
