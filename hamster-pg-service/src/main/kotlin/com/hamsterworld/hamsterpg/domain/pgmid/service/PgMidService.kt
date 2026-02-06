package com.hamsterworld.hamsterpg.domain.pgmid.service

import com.hamsterworld.hamsterpg.app.pgmid.request.PgMidSearchRequest
import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import com.hamsterworld.hamsterpg.domain.pgmid.repository.PgMidRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PgMidService(
    private val repository: PgMidRepository
) {

    @Transactional
    fun createMid(merchantName: String): PgMid {
        // Generate unique midId and apiKey
        val midId = "MID_${System.currentTimeMillis()}_${(1000..9999).random()}"
        val apiKey = java.util.UUID.randomUUID().toString()

        val pgMid = PgMid(
            midId = midId,
            merchantName = merchantName,
            apiKey = apiKey,
            isActive = true
        )
        return repository.save(pgMid)
    }

    fun getMid(midId: String): PgMid {
        return repository.findByMidId(midId)
    }

    @Transactional
    fun deactivateMid(midId: String): PgMid {
        val pgMid = repository.findByMidId(midId)
        val deactivated = pgMid.deactivate()
        return repository.save(deactivated)
    }

    @Transactional
    fun activateMid(midId: String): PgMid {
        val pgMid = repository.findByMidId(midId)
        val activated = pgMid.activate()
        return repository.save(activated)
    }

    fun getAllMids(): List<PgMid> {
        return repository.findAll()
    }

    fun searchMids(request: PgMidSearchRequest): List<PgMid> {
        return repository.searchList(request)
    }

    fun searchMidsPage(request: PgMidSearchRequest): Page<PgMid> {
        return repository.searchPage(request)
    }
}
