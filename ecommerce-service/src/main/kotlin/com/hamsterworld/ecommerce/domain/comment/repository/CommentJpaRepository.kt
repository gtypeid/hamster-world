package com.hamsterworld.ecommerce.domain.comment.repository

import com.hamsterworld.ecommerce.domain.comment.model.Comment
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface CommentJpaRepository : JpaRepository<Comment, Long> {
    fun findByPublicId(publicId: String): Optional<Comment>
}
