package com.hamsterworld.notification.app.dlq.controller

import com.hamsterworld.notification.app.dlq.request.DLQSearchRequest
import com.hamsterworld.notification.domain.dlq.model.DLQMessage
import com.hamsterworld.notification.domain.dlq.service.DLQService
import com.hamsterworld.notification.domain.dlq.service.DLQStatistics
import com.hamsterworld.notification.domain.dlq.service.ReprocessResponse
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/dlq")
class DLQController(
    private val dlqService: DLQService
) {

    @GetMapping("/search/list")
    fun searchList(searchRequest: DLQSearchRequest): ResponseEntity<List<DLQMessage>> {
        return ResponseEntity.ok(dlqService.searchList(searchRequest))
    }

    @GetMapping("/search/page")
    fun searchPage(searchRequest: DLQSearchRequest): ResponseEntity<Page<DLQMessage>> {
        return ResponseEntity.ok(dlqService.searchPage(searchRequest))
    }

    @GetMapping("/{id}")
    fun getMessageById(@PathVariable id: String): ResponseEntity<DLQMessage> {
        val message = dlqService.getMessageById(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(message)
    }

    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<DLQStatistics> {
        return ResponseEntity.ok(dlqService.getStatistics())
    }

    @GetMapping("/pending-count")
    fun getPendingCount(): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(dlqService.getPendingCountDto())
    }

    @GetMapping("/topic/{topic}/pending-count")
    fun getPendingCountByTopic(@PathVariable topic: String): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(dlqService.getPendingCountByTopicDto(topic))
    }

    @GetMapping("/old-pending")
    fun getOldPendingMessages(): ResponseEntity<List<DLQMessage>> {
        return ResponseEntity.ok(dlqService.getOldPendingMessages())
    }

    @PostMapping("/{id}/reprocess")
    fun reprocessMessage(
        @PathVariable id: String,
        @RequestBody request: ReprocessRequest
    ): ResponseEntity<ReprocessResponse> {
        val response = dlqService.reprocessMessageDto(id, request.adminId)
        return if (response.success) {
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.badRequest().body(response)
        }
    }

    @PostMapping("/{id}/resolve")
    fun resolveMessage(
        @PathVariable id: String,
        @RequestBody request: ResolveRequest
    ): ResponseEntity<DLQMessage> {
        val updated = dlqService.markAsResolved(id, request.adminId, request.note)
        return ResponseEntity.ok(updated)
    }

    @PostMapping("/{id}/ignore")
    fun ignoreMessage(
        @PathVariable id: String,
        @RequestBody request: IgnoreRequest
    ): ResponseEntity<DLQMessage> {
        val updated = dlqService.markAsIgnored(id, request.adminId, request.reason)
        return ResponseEntity.ok(updated)
    }
}

data class ReprocessRequest(
    val adminId: String
)

data class ResolveRequest(
    val adminId: String,
    val note: String? = null
)

data class IgnoreRequest(
    val adminId: String,
    val reason: String
)
