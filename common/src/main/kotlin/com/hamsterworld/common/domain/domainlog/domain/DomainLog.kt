package com.hamsterworld.common.domain.domainlog.domain

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "domain_logs",
    indexes = [Index(name = "idx_domain_logs_public_id", columnList = "public_id", unique = true)]
)
class DomainLog(
    var traceId: String = "",
    var ip: String = "",
    var userAgent: String = "",
    var uri: String = "",
    var method: String = "",

    @Column(columnDefinition = "TEXT")
    var parameters: String? = null,

    @Column(columnDefinition = "MEDIUMTEXT")
    var requestBody: String? = null,

    @Column(columnDefinition = "MEDIUMTEXT")
    var responseBody: String? = null,

    var responseStatus: Int? = null,
    var processingResult: String? = null,

    @Column(columnDefinition = "TEXT")
    var errorMessage: String? = null
) : AbsDomain()
