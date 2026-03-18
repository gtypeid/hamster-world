package com.hamsterworld.ecommerce.domain.merchant.model
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
@Embeddable
data class StoreInfo(
    @Column(name = "store_name", nullable = false)
    var storeName: String,
    @Column(name = "contact_email", nullable = false)
    var contactEmail: String,
    @Column(name = "contact_phone", nullable = false, length = 20)
    var contactPhone: String,
    @Column(name = "operating_hours")
    var operatingHours: String? = null,
    @Column(name = "store_description", columnDefinition = "TEXT")
    var storeDescription: String? = null,
    @Column(name = "store_image_url", length = 500)
    var storeImageUrl: String? = null
) {
    constructor() : this("", "", "", null, null, null)
}
