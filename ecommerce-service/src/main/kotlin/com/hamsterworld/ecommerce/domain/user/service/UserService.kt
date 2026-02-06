package com.hamsterworld.ecommerce.domain.user.service

import com.hamsterworld.ecommerce.app.user.request.UserSearchRequest
import com.hamsterworld.ecommerce.domain.user.model.User
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository
) {

    @Transactional
    fun save(user: User): User {
        return userRepository.save(user)
    }

    @Transactional(readOnly = true)
    fun findByKeycloakUserId(keycloakUserId: String): User? {
        return userRepository.findByKeycloakUserIdOrNull(keycloakUserId)
    }

    @Transactional(readOnly = true)
    fun findByPublicId(publicId: String): User {
        return userRepository.findByPublicId(publicId)
    }

    @Transactional(readOnly = true)
    fun findByUsername(username: String): User? {
        return userRepository.findByUsername(username)
    }

    @Transactional(readOnly = true)
    fun existsByUsername(username: String): Boolean {
        return userRepository.existsByUsername(username)
    }

    @Transactional(readOnly = true)
    fun existsByEmail(email: String): Boolean {
        return userRepository.existsByEmail(email)
    }

    @Transactional(readOnly = true)
    fun searchUsers(search: UserSearchRequest): List<User> {
        return userRepository.search(search)
    }

    @Transactional(readOnly = true)
    fun searchUsersPage(search: UserSearchRequest): Page<User> {
        return userRepository.searchPage(search)
    }
}
