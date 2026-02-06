package com.hamsterworld.ecommerce.domain.attachment.service

import com.hamsterworld.ecommerce.app.attachment.dto.UploadFile
import com.hamsterworld.ecommerce.domain.attachment.constant.AttachmentType
import com.hamsterworld.ecommerce.domain.attachment.model.AttachmentDomain
import com.hamsterworld.ecommerce.domain.attachment.repository.AttachmentRepository
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import kotlin.collections.isNullOrEmpty

@Service
class AttachmentService(
    private val attachmentRepository: AttachmentRepository
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun createAttachments(
        attachmentType: AttachmentType,
        targetId: Long,
        targetType: String,
        files: List<UploadFile>?
    ): List<AttachmentDomain> {
        // TODO: StorageClient 연동 필요
        return emptyList()
    }

    fun deleteAttachmentsByIds(attachmentType: AttachmentType, attachmentIds: List<Long>?) {
        if (attachmentIds.isNullOrEmpty()) {
            return
        }

        val attachments = attachmentRepository.findByIdIn(attachmentIds)
        deleteAttachments(attachmentType, attachments)
    }

    fun deleteAttachments(attachmentType: AttachmentType, attachments: List<AttachmentDomain>?) {
        if (attachments.isNullOrEmpty()) {
            return
        }

        // TODO: StorageClient로 파일 삭제 필요

        attachmentRepository.deleteAll(attachments)
    }

    fun convertToUploadFiles(files: List<MultipartFile>?): List<UploadFile> {
        if (files.isNullOrEmpty()) {
            return emptyList()
        }

        return files.map { file ->
            try {
                UploadFile(
                    originalFilename = file.originalFilename ?: "unknown",
                    bytes = file.bytes,
                    mimetype = file.contentType ?: "application/octet-stream"
                )
            } catch (e: Exception) {
                throw CustomRuntimeException("파일 읽기 실패: ${file.originalFilename}", e)
            }
        }
    }
}
