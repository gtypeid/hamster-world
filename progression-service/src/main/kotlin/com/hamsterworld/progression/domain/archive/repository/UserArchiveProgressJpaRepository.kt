package com.hamsterworld.progression.domain.archive.repository

import com.hamsterworld.progression.domain.archive.model.UserArchiveProgress
import org.springframework.data.jpa.repository.JpaRepository

/**
 * UserArchiveProgress JPA Repository
 * Spring Data JPA 기본 메서드만 제공
 */
interface UserArchiveProgressJpaRepository : JpaRepository<UserArchiveProgress, Long> {

    fun findByUserPublicId(userPublicId: String): List<UserArchiveProgress>

    fun findByUserPublicIdAndArchiveId(userPublicId: String, archiveId: String): UserArchiveProgress?

    fun existsByUserPublicIdAndArchiveId(userPublicId: String, archiveId: String): Boolean

    fun findByIsCompleted(completed: Boolean): List<UserArchiveProgress>
}
