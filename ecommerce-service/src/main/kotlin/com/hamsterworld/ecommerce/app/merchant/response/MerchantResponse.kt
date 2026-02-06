package com.hamsterworld.ecommerce.app.merchant.response

import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Merchant 응답 DTO
 */
data class MerchantResponse(
    val merchantPublicId: String,  // Merchant Public ID
    val userPublicId: String,      // User Public ID
    val status: MerchantStatus,
    val cashGatewayMid: String,

    // 사업자 정보
    val businessName: String,
    val businessNumber: String,
    val representativeName: String,
    val businessAddress: String?,
    val businessType: String?,

    // 스토어 정보
    val storeName: String,
    val contactEmail: String,
    val contactPhone: String,
    val operatingHours: String?,
    val storeDescription: String?,
    val storeImageUrl: String?,

    // 정산 정보
    val bankName: String,
    val accountNumber: String,
    val accountHolder: String,
    val settlementCycle: SettlementCycle,
    val platformCommissionRate: BigDecimal,

    // 메타데이터
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(merchant: Merchant, userPublicId: String): MerchantResponse {
            return MerchantResponse(
                merchantPublicId = merchant.publicId,
                userPublicId = userPublicId,
                status = merchant.status,
                cashGatewayMid = merchant.cashGatewayMid,
                // 사업자 정보
                businessName = merchant.businessInfo.businessName,
                businessNumber = merchant.businessInfo.businessNumber,
                representativeName = merchant.businessInfo.representativeName,
                businessAddress = merchant.businessInfo.businessAddress,
                businessType = merchant.businessInfo.businessType,
                // 스토어 정보
                storeName = merchant.storeInfo.storeName,
                contactEmail = merchant.storeInfo.contactEmail,
                contactPhone = merchant.storeInfo.contactPhone,
                operatingHours = merchant.storeInfo.operatingHours,
                storeDescription = merchant.storeInfo.storeDescription,
                storeImageUrl = merchant.storeInfo.storeImageUrl,
                // 정산 정보
                bankName = merchant.settlementInfo.bankName,
                accountNumber = merchant.settlementInfo.accountNumber,
                accountHolder = merchant.settlementInfo.accountHolder,
                settlementCycle = merchant.settlementInfo.settlementCycle,
                platformCommissionRate = merchant.settlementInfo.platformCommissionRate,
                // 메타데이터
                createdAt = merchant.createdAt,
                modifiedAt = merchant.modifiedAt
            )
        }
    }
}
