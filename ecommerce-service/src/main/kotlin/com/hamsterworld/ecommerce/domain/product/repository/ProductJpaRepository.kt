package com.hamsterworld.ecommerce.domain.product.repository

import com.hamsterworld.ecommerce.domain.product.model.Product
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface ProductJpaRepository : JpaRepository<Product, Long> {
    fun findBySku(sku: String): Optional<Product>
    fun existsBySku(sku: String): Boolean
    fun findByPublicId(publicId: String): Optional<Product>
}
