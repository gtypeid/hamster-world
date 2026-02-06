package com.hamsterworld.ecommerce.external.storage.abs

import com.hamsterworld.common.external.ExternalClientProtocol
import com.hamsterworld.ecommerce.domain.attachment.constant.AttachmentType
import com.hamsterworld.ecommerce.external.storage.dto.UploadFile

interface StorageClientProtocol : ExternalClientProtocol {

    fun uploadFile(attachmentType: AttachmentType, file: UploadFile): String

    fun deleteFile(attachmentType: AttachmentType, path: String): Boolean
}
