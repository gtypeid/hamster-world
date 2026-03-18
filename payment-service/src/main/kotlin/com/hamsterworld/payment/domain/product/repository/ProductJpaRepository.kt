package com.hamsterworld.payment.domain.product.repository

import com.hamsterworld.payment.domain.product.model.Product
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

interface ProductJpaRepository : JpaRepository<Product, Long> {
    fun findByWeekId(weekId: String): Optional<Product>

    fun findBySku(sku: String): Optional<Product>

    fun existsBySku(sku: String): Boolean

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    fun findByIdForUpdate(@Param("id") id: Long): Optional<Product>
}
