package com.hamsterworld.hamsterpg.domain.pgmid.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "pg_mids",
    indexes = [
        Index(name = "idx_pg_mids_public_id", columnList = "public_id", unique = true)
    ]
)
class PgMid(
    @Column(nullable = false, unique = true, length = 100)
    var midId: String,

    @Column(nullable = false, length = 200)
    var merchantName: String,

    @Column(nullable = false, unique = true, length = 100)
    var apiKey: String,

    @Column(nullable = false)
    var isActive: Boolean = true

) : AbsDomain() {

    /**
     * MID 비활성화
     */
    fun deactivate(): PgMid {
        this.isActive = false
        return this
    }

    /**
     * MID 활성화
     */
    fun activate(): PgMid {
        this.isActive = true
        return this
    }
}
