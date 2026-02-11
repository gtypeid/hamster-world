package com.hamsterworld.ecommerce.app.user.controller

import com.hamsterworld.ecommerce.app.user.response.UserResponse
import com.hamsterworld.ecommerce.domain.user.model.User
import com.hamsterworld.ecommerce.domain.user.service.UserService
import com.hamsterworld.common.domain.auth.UserRole
import com.hamsterworld.common.web.exception.CustomRuntimeException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "사용자")
@RequestMapping("/api/users")
@RestController
class UserController(
    private val userService: UserService
) {

    @Operation(summary = "사용자 단건 조회")
    @GetMapping("/{keycloakUserId}")
    fun getUser(
        @PathVariable keycloakUserId: String,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<UserResponse> {
        // 본인 확인: 본인이 아니고 ADMIN 이상도 아니면 거부
        if (user.keycloakUserId != keycloakUserId && !user.role.isHigherOrEqualTo(UserRole.ADMIN)) {
            throw CustomRuntimeException("본인의 정보만 조회할 수 있습니다")
        }

        val response = userService.getUserResponseByKeycloakUserId(keycloakUserId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(response)
    }
}
