package com.hamsterworld.ecommerce.external.storage.properties

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "payment.storage.client")
data class StorageProperties(
    var accountId: String? = null,
    var accessKey: String? = null,
    var secretKey: String? = null,
    var baseUrl: String? = null
)
