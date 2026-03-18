package com.hamsterworld.ecommerce.app.merchant.response
import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import java.math.BigDecimal
import java.time.LocalDateTime
data class MerchantResponse(
    val merchantPublicId: String,
    val userPublicId: String,
    val status: MerchantStatus,
    val cashGatewayMid: String,
    val businessName: String,
    val businessNumber: String,
    val representativeName: String,
    val businessAddress: String?,
    val businessType: String?,
    val storeName: String,
    val contactEmail: String,
    val contactPhone: String,
    val operatingHours: String?,
    val storeDescription: String?,
    val storeImageUrl: String?,
    val bankName: String,
    val accountNumber: String,
    val accountHolder: String,
    val settlementCycle: SettlementCycle,
    val platformCommissionRate: BigDecimal,
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
                businessName = merchant.businessInfo.businessName,
                businessNumber = merchant.businessInfo.businessNumber,
                representativeName = merchant.businessInfo.representativeName,
                businessAddress = merchant.businessInfo.businessAddress,
                businessType = merchant.businessInfo.businessType,
                storeName = merchant.storeInfo.storeName,
                contactEmail = merchant.storeInfo.contactEmail,
                contactPhone = merchant.storeInfo.contactPhone,
                operatingHours = merchant.storeInfo.operatingHours,
                storeDescription = merchant.storeInfo.storeDescription,
                storeImageUrl = merchant.storeInfo.storeImageUrl,
                bankName = merchant.settlementInfo.bankName,
                accountNumber = merchant.settlementInfo.accountNumber,
                accountHolder = merchant.settlementInfo.accountHolder,
                settlementCycle = merchant.settlementInfo.settlementCycle,
                platformCommissionRate = merchant.settlementInfo.platformCommissionRate,
                createdAt = merchant.createdAt,
                modifiedAt = merchant.modifiedAt
            )
        }
    }
}
