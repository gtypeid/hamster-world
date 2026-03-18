package com.hamsterworld.ecommerce.domain.merchant.model
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
@Embeddable
data class BusinessInfo(
    @Column(name = "business_name", nullable = false)
    var businessName: String,
    @Column(name = "business_number", nullable = false, unique = true, length = 20)
    var businessNumber: String,
    @Column(name = "representative_name", nullable = false)
    var representativeName: String,
    @Column(name = "business_address")
    var businessAddress: String? = null,
    @Column(name = "business_type")
    var businessType: String? = null
) {
    constructor() : this("", "", "", null, null)
}
