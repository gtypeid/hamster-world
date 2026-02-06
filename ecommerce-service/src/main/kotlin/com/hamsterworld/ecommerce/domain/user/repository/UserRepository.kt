package com.hamsterworld.ecommerce.domain.user.repository

import com.hamsterworld.ecommerce.app.user.request.UserSearchRequest
import com.hamsterworld.ecommerce.domain.user.model.User
import com.hamsterworld.ecommerce.domain.user.model.QUser.user
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class UserRepository(
    private val userJpaRepository: UserJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {
    fun save(user: User): User {
        return userJpaRepository.save(user)
    }

    fun update(user: User): User {
        val copy = user.copy()
        copy.modifiedAt = LocalDateTime.now()
        return userJpaRepository.save(copy)
    }

    fun findById(id: Long): User {
        return userJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("사용자를 찾을 수 없습니다. ID: $id") }
    }

    fun findByIds(ids: List<Long>): List<User> {
        if (ids.isEmpty()) return emptyList()
        return jpaQueryFactory
            .selectFrom(user)
            .where(user.id.`in`(ids))
            .fetch()
    }

    fun findByPublicId(publicId: String): User {
        return userJpaRepository.findByPublicId(publicId)
            .orElseThrow { CustomRuntimeException("사용자를 찾을 수 없습니다. publicId: $publicId") }
    }

    fun findByKeycloakUserId(keycloakUserId: String): User {
        return userJpaRepository.findByKeycloakUserId(keycloakUserId)
            .orElseThrow { CustomRuntimeException("사용자를 찾을 수 없습니다. keycloakUserId: $keycloakUserId") }
    }

    fun findByKeycloakUserIdOrNull(keycloakUserId: String): User? {
        return userJpaRepository.findByKeycloakUserId(keycloakUserId)
            .orElse(null)
    }

    fun findByUsername(username: String): User {
        return userJpaRepository.findByUsername(username)
            .orElseThrow { CustomRuntimeException("사용자를 찾을 수 없습니다. username: $username") }
    }

    fun existsByUsername(username: String): Boolean {
        return userJpaRepository.existsByUsername(username)
    }

    fun existsByEmail(email: String): Boolean {
        return userJpaRepository.existsByEmail(email)
    }

    fun search(request: UserSearchRequest): List<User> {
        val query = baseQuery(request)

        return QuerydslExtension.applySorts(query, user.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: UserSearchRequest): Page<User> {
        val baseQuery = baseQuery(request)

        // Count query
        val total = jpaQueryFactory
            .select(user.count())
            .from(user)
            .where(*searchConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, user.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }

    private fun baseQuery(request: UserSearchRequest): com.querydsl.jpa.impl.JPAQuery<User> {
        return jpaQueryFactory
            .selectFrom(user)
            .where(*searchConditions(request).toTypedArray())
    }

    private fun searchConditions(request: UserSearchRequest): List<com.querydsl.core.types.dsl.BooleanExpression?> {
        return listOfNotNull(
            QuerydslExtension.match(user.keycloakUserId, request.userId, request.match),
            QuerydslExtension.match(user.username, request.username, request.match),
            QuerydslExtension.match(user.email, request.email, request.match),
            QuerydslExtension.eqOrNull(user.role, request.role),
            QuerydslExtension.inOrNullSafe(user.publicId, request.publicIds),
            QuerydslExtension.between(user.createdAt, request.from, request.to)
        )
    }
}
