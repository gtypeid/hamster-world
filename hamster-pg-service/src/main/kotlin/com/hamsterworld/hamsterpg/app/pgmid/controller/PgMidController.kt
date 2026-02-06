package com.hamsterworld.hamsterpg.app.pgmid.controller

import com.hamsterworld.hamsterpg.app.pgmid.request.CreateMidRequest
import com.hamsterworld.hamsterpg.app.pgmid.request.PgMidSearchRequest
import com.hamsterworld.hamsterpg.app.pgmid.response.MidResponse
import com.hamsterworld.hamsterpg.domain.pgmid.service.PgMidService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/mid")
class PgMidController(
    private val pgMidService: PgMidService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostMapping
    fun createMid(
        @Valid @RequestBody request: CreateMidRequest
    ): ResponseEntity<MidResponse> {
        log.info("Creating MID: merchantName=${request.merchantName}")

        val pgMid = pgMidService.createMid(request.merchantName)
        val response = MidResponse.from(pgMid)

        log.info("MID created successfully: midId=${response.midId}, apiKey=${response.apiKey}")

        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/{midId}")
    fun getMid(
        @PathVariable midId: String
    ): ResponseEntity<MidResponse> {
        log.info("Getting MID: midId=$midId")

        val pgMid = pgMidService.getMid(midId)
        val response = MidResponse.from(pgMid)

        return ResponseEntity.ok(response)
    }

    @GetMapping("/list")
    fun searchMidList(
        @ModelAttribute search: PgMidSearchRequest
    ): ResponseEntity<List<MidResponse>> {
        log.info("Searching MIDs (list): midId=${search.midId}, merchantName=${search.merchantName}, isActive=${search.isActive}")

        val pgMids = pgMidService.searchMids(search)
        val responses = pgMids.map { MidResponse.from(it) }

        log.info("Found ${responses.size} MIDs")

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/page")
    fun searchMidPage(
        @ModelAttribute search: PgMidSearchRequest
    ): ResponseEntity<Page<MidResponse>> {
        log.info("Searching MIDs (page): page=${search.page}, size=${search.size}")

        val page = pgMidService.searchMidsPage(search)
        val responses = page.map { MidResponse.from(it) }

        log.info("Found ${page.totalElements} MIDs (page ${page.number}/${page.totalPages})")

        return ResponseEntity.ok(responses)
    }

    @PostMapping("/{midId}/deactivate")
    fun deactivateMid(
        @PathVariable midId: String
    ): ResponseEntity<MidResponse> {
        log.info("Deactivating MID: midId=$midId")

        val pgMid = pgMidService.deactivateMid(midId)
        val response = MidResponse.from(pgMid)

        log.info("MID deactivated: midId=$midId")

        return ResponseEntity.ok(response)
    }

    @PostMapping("/{midId}/activate")
    fun activateMid(
        @PathVariable midId: String
    ): ResponseEntity<MidResponse> {
        log.info("Activating MID: midId=$midId")

        val pgMid = pgMidService.activateMid(midId)
        val response = MidResponse.from(pgMid)

        log.info("MID activated: midId=$midId")

        return ResponseEntity.ok(response)
    }
}
