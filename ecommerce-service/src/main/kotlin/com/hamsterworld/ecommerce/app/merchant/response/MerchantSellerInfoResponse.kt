package com.hamsterworld.ecommerce.app.merchant.response
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
data class MerchantSellerInfoResponse(
    val merchantPublicId: String,
    val storeName: String,
    val storeDescription: String?,
    val storeImageUrl: String?,
    val operatingHours: String?,
    val businessName: String,
    val contactEmail: String,
    val contactPhone: String
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
