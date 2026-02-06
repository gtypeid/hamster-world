package com.hamsterworld.ecommerce.domain.user.repository

import com.hamsterworld.ecommerce.domain.user.model.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserJpaRepository : JpaRepository<User, Long> {
    fun findByPublicId(publicId: String): Optional<User>
    fun findByKeycloakUserId(keycloakUserId: String): Optional<User>
    fun findByUsername(username: String): Optional<User>
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
}
