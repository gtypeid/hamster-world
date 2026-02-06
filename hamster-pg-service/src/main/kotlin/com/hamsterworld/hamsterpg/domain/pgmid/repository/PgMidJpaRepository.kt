package com.hamsterworld.hamsterpg.domain.pgmid.repository

import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface PgMidJpaRepository : JpaRepository<PgMid, Long> {
    fun findByMidId(midId: String): Optional<PgMid>
    fun findByApiKey(apiKey: String): Optional<PgMid>
}
