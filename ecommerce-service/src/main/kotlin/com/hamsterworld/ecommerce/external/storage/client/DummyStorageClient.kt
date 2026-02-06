package com.hamsterworld.ecommerce.external.storage.client

import com.hamsterworld.ecommerce.external.storage.abs.StorageClientProtocolCore
import com.hamsterworld.ecommerce.external.storage.dto.UploadFile
import com.hamsterworld.ecommerce.external.storage.properties.StorageProperties
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class DummyStorageClient(
    properties: StorageProperties
) : StorageClientProtocolCore(properties) {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun doUploadFile(bucket: String, path: String, file: UploadFile): String {
        val fullUrl = buildFullUrl(bucket, path)
        log.info("Dummy upload completed - URL: {}", fullUrl)
        return fullUrl
    }

    override fun doDeleteFile(bucket: String, path: String): Boolean {
        log.info("Dummy delete - bucket: {}, path: {}", bucket, path)
        return true
    }
}
