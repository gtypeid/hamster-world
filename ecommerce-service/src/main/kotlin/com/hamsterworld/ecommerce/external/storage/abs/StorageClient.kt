package com.hamsterworld.ecommerce.external.storage.abs

import com.hamsterworld.ecommerce.domain.attachment.constant.AttachmentType
import com.hamsterworld.ecommerce.external.storage.dto.UploadFile
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class StorageClient(
    private val registry: StorageClientRegistry
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun <T : StorageClientProtocol> bind(clientClass: Class<T>): StorageClientProtocol {
        val delegate = registry.getClient(clientClass)
        return StorageClientRunner(delegate)
    }

    // inner class
    private class StorageClientRunner(
        private val delegate: StorageClientProtocol
    ) : StorageClientProtocol {

        override fun uploadFile(attachmentType: AttachmentType, file: UploadFile): String {
            val result = delegate.uploadFile(attachmentType, file)
            return result
        }

        override fun deleteFile(attachmentType: AttachmentType, path: String): Boolean {
            delegate.deleteFile(attachmentType, path)
            return true
        }
    }
}
