package com.hamsterworld.ecommerce.external.storage.abs

import com.hamsterworld.ecommerce.domain.attachment.constant.AttachmentType
import com.hamsterworld.ecommerce.external.storage.dto.UploadFile
import com.hamsterworld.ecommerce.external.storage.properties.StorageProperties
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import java.util.*

abstract class StorageClientProtocolCore(
    protected val properties: StorageProperties
) : StorageClientProtocol {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun uploadFile(attachmentType: AttachmentType, file: UploadFile): String {
        val path = buildPath(attachmentType, file)
        return doUploadFile(attachmentType.bucket, path, file)
    }

    override fun deleteFile(attachmentType: AttachmentType, path: String): Boolean {
        doDeleteFile(attachmentType.bucket, path)
        return true
    }

    protected abstract fun doUploadFile(bucket: String, path: String, file: UploadFile): String
    protected abstract fun doDeleteFile(bucket: String, path: String): Boolean

    protected fun buildPath(attachmentType: AttachmentType, file: UploadFile): String {
        val extension = extractExtension(file.originalFilename)
        val fileName = "${UUID.randomUUID()}.$extension"
        return "${attachmentType.root}/$fileName"
    }

    protected fun buildFullUrl(bucket: String, path: String): String {
        val baseUrl = properties.baseUrl
        if (baseUrl.isNullOrBlank()) {
            throw CustomRuntimeException("저장소 URL 존재하지 않습니다")
        }

        return "$baseUrl/$bucket/$path"
    }

    protected fun extractExtension(filename: String): String {
        if (!filename.contains(".")) {
            return "bin"
        }
        return filename.substring(filename.lastIndexOf(".") + 1)
    }
}
