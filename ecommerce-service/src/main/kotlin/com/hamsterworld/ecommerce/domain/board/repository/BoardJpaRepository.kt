package com.hamsterworld.ecommerce.domain.board.repository

import com.hamsterworld.ecommerce.domain.board.model.Board
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BoardJpaRepository : JpaRepository<Board, Long> {
    fun findByPublicId(publicId: String): Optional<Board>
}
