package com.hamsterworld.ecommerce.app.merchant.response

import com.hamsterworld.ecommerce.domain.merchant.model.Merchant

/**
 * 판매자 공개 정보 응답 DTO
 *
 * 비로그인 사용자도 접근 가능한 공개 정보만 포함
 * - 민감 정보 제외: 사업자번호, 대표자명, 계좌정보, 정산정보 등
 */
data class MerchantSellerInfoResponse(
    val merchantPublicId: String,  // Merchant Public ID
    val storeName: String,         // 스토어명
    val storeDescription: String?, // 스토어 소개
    val storeImageUrl: String?,    // 스토어 이미지
    val operatingHours: String?,   // 운영 시간
    val businessName: String,      // 상호명 (공개)
    val contactEmail: String,      // 연락처 이메일 (공개)
    val contactPhone: String       // 연락처 전화번호 (공개)
) {
    companion object {
        fun from(merchant: Merchant): MerchantSellerInfoResponse {
            return MerchantSellerInfoResponse(
                merchantPublicId = merchant.publicId,
                storeName = merchant.storeInfo.storeName,
                storeDescription = merchant.storeInfo.storeDescription,
                storeImageUrl = merchant.storeInfo.storeImageUrl,
                operatingHours = merchant.storeInfo.operatingHours,
                businessName = merchant.businessInfo.businessName,
                contactEmail = merchant.storeInfo.contactEmail,
                contactPhone = merchant.storeInfo.contactPhone
            )
        }
    }
}
