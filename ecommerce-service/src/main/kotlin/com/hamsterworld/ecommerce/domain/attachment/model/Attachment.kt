package com.hamsterworld.ecommerce.domain.attachment.model

import com.hamsterworld.common.domain.audit.handler.AuditEntityTargetListener
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Entity
import jakarta.persistence.EntityListeners
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "attachments",
    indexes = [
        Index(name = "idx_attachments_public_id", columnList = "public_id", unique = true)
    ]
)
@EntityListeners(AuditEntityTargetListener::class)
class AttachmentDomain(
    var targetId: Long,
    var targetType: String,
    var path: String,
    var name: String? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        targetId: Long = this.targetId,
        targetType: String = this.targetType,
        path: String = this.path,
        name: String? = this.name
    ): AttachmentDomain {
        val copied = AttachmentDomain(
            targetId = targetId,
            targetType = targetType,
            path = path,
            name = name
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    override fun toString(): String {
        return "AttachmentEntity(id=$id, targetId=$targetId, targetType='$targetType', path='$path', name=$name)"
    }
}
