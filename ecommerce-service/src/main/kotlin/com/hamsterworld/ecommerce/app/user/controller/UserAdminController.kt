package com.hamsterworld.ecommerce.app.user.controller

import com.hamsterworld.ecommerce.app.user.request.UserSearchRequest
import com.hamsterworld.ecommerce.app.user.response.UserResponse
import com.hamsterworld.ecommerce.domain.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

/**
 * 사용자 Admin Controller
 *
 * DEVELOPER role 전용 - 모든 사용자 관리
 */
@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "사용자 Admin", description = "관리자용 사용자 관리 API")
@PreAuthorize("hasRole('DEVELOPER')")
class UserAdminController(
    private val userService: UserService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(
        summary = "사용자 Keycloak ID로 조회 (Admin)",
        description = "관리자가 Keycloak User ID로 사용자를 조회합니다"
    )
    @GetMapping("/keycloak/{keycloakUserId}")
    fun getUserByKeycloakId(
        @PathVariable keycloakUserId: String
    ): ResponseEntity<UserResponse> {
        log.info("[Admin] Getting user by keycloakUserId: $keycloakUserId")

        val response = userService.getUserResponseByKeycloakUserId(keycloakUserId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(response)
    }

    @Operation(
        summary = "사용자 Public ID로 조회 (Admin)",
        description = "관리자가 Public ID로 사용자를 조회합니다"
    )
    @GetMapping("/{publicId}")
    fun getUserByPublicId(
        @PathVariable publicId: String
    ): ResponseEntity<UserResponse> {
        log.info("[Admin] Getting user by publicId: $publicId")

        return ResponseEntity.ok(userService.getUserResponseByPublicId(publicId))
    }

    @Operation(
        summary = "전체 사용자 목록 조회",
        description = "관리자가 검색 조건에 맞는 모든 사용자 목록을 조회합니다"
    )
    @GetMapping("/list")
    fun searchUserList(
        @ModelAttribute search: UserSearchRequest
    ): ResponseEntity<List<UserResponse>> {
        log.info("[Admin] Searching users (list): userId=${search.userId}, username=${search.username}, role=${search.role}")

        val responses = userService.searchUserResponses(search)

        log.info("[Admin] Found ${responses.size} users")

        return ResponseEntity.ok(responses)
    }

    @Operation(
        summary = "전체 사용자 페이지 조회",
        description = "관리자가 검색 조건에 맞는 사용자를 페이징하여 조회합니다"
    )
    @GetMapping("/page")
    fun searchUserPage(
        @ModelAttribute search: UserSearchRequest
    ): ResponseEntity<Page<UserResponse>> {
        log.info("[Admin] Searching users (page): page=${search.page}, size=${search.size}")

        val responses = userService.searchUserResponsesPage(search)

        log.info("[Admin] Found ${responses.totalElements} users (page ${responses.number}/${responses.totalPages})")

        return ResponseEntity.ok(responses)
    }
}
