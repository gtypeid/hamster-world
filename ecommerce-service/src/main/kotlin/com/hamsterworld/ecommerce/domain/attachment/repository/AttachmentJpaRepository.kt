package com.hamsterworld.ecommerce.domain.attachment.repository

import com.hamsterworld.ecommerce.domain.attachment.model.AttachmentDomain
import org.springframework.data.jpa.repository.JpaRepository

interface AttachmentJpaRepository : JpaRepository<AttachmentDomain, Long> {
    fun findByIdIn(ids: List<Long>): List<AttachmentDomain>
    fun findByPathIn(paths: List<String>): List<AttachmentDomain>
}
