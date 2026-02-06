package com.hamsterworld.ecommerce.app.merchant.request

import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import java.math.BigDecimal

/**
 * Merchant 생성 요청
 */
data class MerchantCreateRequest(
    // 사업자 정보
    val businessName: String,           // 상호명 *
    val businessNumber: String,         // 사업자등록번호 *
    val representativeName: String,     // 대표자명 *
    val businessAddress: String? = null,  // 사업장 주소
    val businessType: String? = null,     // 업종

    // 스토어 정보
    val storeName: String,              // 스토어명 *
    val contactEmail: String,           // 연락처 이메일 *
    val contactPhone: String,           // 연락처 전화번호 *
    val operatingHours: String? = null,   // 운영 시간
    val storeDescription: String? = null, // 스토어 소개
    val storeImageUrl: String? = null,    // 스토어 이미지 URL

    // 정산 정보
    val bankName: String,               // 은행명 *
    val accountNumber: String,          // 계좌번호 *
    val accountHolder: String,          // 예금주 *
    val settlementCycle: SettlementCycle = SettlementCycle.WEEKLY  // 정산 주기
) {
    fun toBusinessInfo(): BusinessInfo {
        return BusinessInfo(
            businessName = businessName,
            businessNumber = businessNumber,
            representativeName = representativeName,
            businessAddress = businessAddress,
            businessType = businessType
        )
    }

    fun toStoreInfo(): StoreInfo {
        return StoreInfo(
            storeName = storeName,
            contactEmail = contactEmail,
            contactPhone = contactPhone,
            operatingHours = operatingHours,
            storeDescription = storeDescription,
            storeImageUrl = storeImageUrl
        )
    }

    fun toSettlementInfo(platformCommissionRate: BigDecimal = BigDecimal("3.5")): SettlementInfo {
        return SettlementInfo(
            bankName = bankName,
            accountNumber = accountNumber,
            accountHolder = accountHolder,
            settlementCycle = settlementCycle,
            platformCommissionRate = platformCommissionRate
        )
    }
}
