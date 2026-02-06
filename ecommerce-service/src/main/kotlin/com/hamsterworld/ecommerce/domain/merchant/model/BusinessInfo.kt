package com.hamsterworld.ecommerce.domain.merchant.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable

/**
 * 사업자 정보 (Value Object)
 *
 * Merchant 엔티티에 임베드되어 사용
 */
@Embeddable
data class BusinessInfo(
    @Column(name = "business_name", nullable = false)
    var businessName: String,  // 상호명 *

    @Column(name = "business_number", nullable = false, unique = true, length = 20)
    var businessNumber: String,  // 사업자등록번호 *

    @Column(name = "representative_name", nullable = false)
    var representativeName: String,  // 대표자명 *

    @Column(name = "business_address")
    var businessAddress: String? = null,  // 사업장 주소

    @Column(name = "business_type")
    var businessType: String? = null  // 업종
) {
    constructor() : this("", "", "", null, null)
}
