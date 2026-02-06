package com.hamsterworld.ecommerce.app.user.response

import com.hamsterworld.common.domain.auth.UserRole
import com.hamsterworld.ecommerce.domain.user.model.User
import java.time.LocalDateTime

data class UserResponse(
    val id: Long?,
    val publicId: String,
    val keycloakUserId: String,
    val username: String,
    val email: String,
    val name: String,
    val role: UserRole,
    val createdAt: LocalDateTime?
) {
    companion object {
        fun from(user: User): UserResponse {
            return UserResponse(
                id = user.id,
                publicId = user.publicId,
                keycloakUserId = user.keycloakUserId,
                username = user.username,
                email = user.email,
                name = user.name,
                role = user.role,
                createdAt = user.createdAt
            )
        }
    }
}
