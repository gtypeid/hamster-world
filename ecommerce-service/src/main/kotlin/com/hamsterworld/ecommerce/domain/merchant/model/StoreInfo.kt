package com.hamsterworld.ecommerce.domain.merchant.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable

/**
 * 스토어 정보 (Value Object)
 *
 * Merchant 엔티티에 임베드되어 사용
 */
@Embeddable
data class StoreInfo(
    @Column(name = "store_name", nullable = false)
    var storeName: String,  // 스토어명 * (예: "도토리 장수 함돌이")

    @Column(name = "contact_email", nullable = false)
    var contactEmail: String,  // 연락처 이메일 *

    @Column(name = "contact_phone", nullable = false, length = 20)
    var contactPhone: String,  // 연락처 전화번호 *

    @Column(name = "operating_hours")
    var operatingHours: String? = null,  // 운영 시간 (예: "평일 09:00 - 18:00")

    @Column(name = "store_description", columnDefinition = "TEXT")
    var storeDescription: String? = null,  // 스토어 소개

    @Column(name = "store_image_url", length = 500)
    var storeImageUrl: String? = null  // 스토어 이미지 URL
) {
    constructor() : this("", "", "", null, null, null)
}
