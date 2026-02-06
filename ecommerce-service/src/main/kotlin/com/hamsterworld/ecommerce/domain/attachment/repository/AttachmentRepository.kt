package com.hamsterworld.ecommerce.domain.attachment.repository

import com.hamsterworld.ecommerce.domain.attachment.model.AttachmentDomain
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository

@Repository
class AttachmentRepository(
    private val attachmentJpaRepository: AttachmentJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun findByIdIn(ids: List<Long>): List<AttachmentDomain> {
        return attachmentJpaRepository.findByIdIn(ids)
    }

    fun findByInPath(paths: List<String>): List<AttachmentDomain> {
        return attachmentJpaRepository.findByPathIn(paths)
    }

    fun saveAll(attachments: List<AttachmentDomain>): List<AttachmentDomain> {
        return attachmentJpaRepository.saveAll(attachments).toList()
    }

    fun deleteAll(attachments: List<AttachmentDomain>) {
        attachmentJpaRepository.deleteAll(attachments)
    }
}
