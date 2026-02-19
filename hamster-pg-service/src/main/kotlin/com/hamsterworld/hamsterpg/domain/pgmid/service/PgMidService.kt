package com.hamsterworld.hamsterpg.domain.pgmid.service

import com.hamsterworld.hamsterpg.app.pgmid.request.PgMidSearchRequest
import com.hamsterworld.hamsterpg.app.pgmid.response.MidResponse
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
    fun createMid(merchantName: String, webhookUrl: String): PgMid {
        val pgMid = PgMid.create(merchantName, webhookUrl)
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

    // DTO conversion methods (used by controllers)
    @Transactional
    fun createMidResponse(merchantName: String, webhookUrl: String): MidResponse {
        val pgMid = createMid(merchantName, webhookUrl)
        return MidResponse.from(pgMid)
    }

    fun getMidResponse(midId: String): MidResponse {
        val pgMid = getMid(midId)
        return MidResponse.from(pgMid)
    }

    fun searchMidsResponseList(request: PgMidSearchRequest): List<MidResponse> {
        val pgMids = searchMids(request)
        return pgMids.map { MidResponse.from(it) }
    }

    fun searchMidsResponsePage(request: PgMidSearchRequest): Page<MidResponse> {
        val page = searchMidsPage(request)
        return page.map { MidResponse.from(it) }
    }

    @Transactional
    fun deactivateMidResponse(midId: String): MidResponse {
        val pgMid = deactivateMid(midId)
        return MidResponse.from(pgMid)
    }

    @Transactional
    fun activateMidResponse(midId: String): MidResponse {
        val pgMid = activateMid(midId)
        return MidResponse.from(pgMid)
    }
}
