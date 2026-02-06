package com.hamsterworld.ecommerce.external.storage.client

import com.hamsterworld.ecommerce.external.storage.abs.StorageClientProtocolCore
import com.hamsterworld.ecommerce.external.storage.dto.UploadFile
import com.hamsterworld.ecommerce.external.storage.properties.StorageProperties
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class S3StorageClient(
    properties: StorageProperties
) : StorageClientProtocolCore(properties) {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun doUploadFile(bucket: String, path: String, file: UploadFile): String {
        // TODO
        return ""
    }

    override fun doDeleteFile(bucket: String, path: String): Boolean {
        // TODO
        return true
    }
}
