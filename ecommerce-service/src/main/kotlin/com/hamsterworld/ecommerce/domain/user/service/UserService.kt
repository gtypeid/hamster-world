package com.hamsterworld.ecommerce.domain.user.service

import com.hamsterworld.ecommerce.app.user.request.UserSearchRequest
import com.hamsterworld.ecommerce.app.user.response.UserResponse
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

    // DTO-returning methods for Controllers

    @Transactional(readOnly = true)
    fun getUserResponseByKeycloakUserId(keycloakUserId: String): UserResponse? {
        val user = userRepository.findByKeycloakUserIdOrNull(keycloakUserId)
        return user?.let { UserResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getUserResponseByPublicId(publicId: String): UserResponse {
        val user = userRepository.findByPublicId(publicId)
        return UserResponse.from(user)
    }

    @Transactional(readOnly = true)
    fun searchUserResponses(search: UserSearchRequest): List<UserResponse> {
        val users = userRepository.search(search)
        return users.map { UserResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun searchUserResponsesPage(search: UserSearchRequest): Page<UserResponse> {
        val page = userRepository.searchPage(search)
        return page.map { UserResponse.from(it) }
    }
}
