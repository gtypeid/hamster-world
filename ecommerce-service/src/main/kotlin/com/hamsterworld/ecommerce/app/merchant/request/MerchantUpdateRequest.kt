package com.hamsterworld.ecommerce.app.merchant.request
import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import java.math.BigDecimal
data class MerchantUpdateRequest(
    val businessName: String? = null,
    val businessNumber: String? = null,
    val representativeName: String? = null,
    val businessAddress: String? = null,
    val businessType: String? = null,
    val storeName: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val operatingHours: String? = null,
    val storeDescription: String? = null,
    val storeImageUrl: String? = null,
    val bankName: String? = null,
    val accountNumber: String? = null,
    val accountHolder: String? = null,
    val settlementCycle: SettlementCycle? = null
) {
    fun hasBusinessInfoUpdate(): Boolean {
        return businessName != null || businessNumber != null || representativeName != null ||
                businessAddress != null || businessType != null
    }
    fun hasStoreInfoUpdate(): Boolean {
        return storeName != null || contactEmail != null || contactPhone != null ||
                operatingHours != null || storeDescription != null || storeImageUrl != null
    }
    fun hasSettlementInfoUpdate(): Boolean {
        return bankName != null || accountNumber != null || accountHolder != null || settlementCycle != null
    }
    fun toBusinessInfo(existing: BusinessInfo): BusinessInfo {
        return BusinessInfo(
            businessName = businessName ?: existing.businessName,
            businessNumber = businessNumber ?: existing.businessNumber,
            representativeName = representativeName ?: existing.representativeName,
            businessAddress = businessAddress ?: existing.businessAddress,
            businessType = businessType ?: existing.businessType
        )
    }
    fun toStoreInfo(existing: StoreInfo): StoreInfo {
        return StoreInfo(
            storeName = storeName ?: existing.storeName,
            contactEmail = contactEmail ?: existing.contactEmail,
            contactPhone = contactPhone ?: existing.contactPhone,
            operatingHours = operatingHours ?: existing.operatingHours,
            storeDescription = storeDescription ?: existing.storeDescription,
            storeImageUrl = storeImageUrl ?: existing.storeImageUrl
        )
    }
    fun toSettlementInfo(existing: SettlementInfo): SettlementInfo {
        return SettlementInfo(
            bankName = bankName ?: existing.bankName,
            accountNumber = accountNumber ?: existing.accountNumber,
            accountHolder = accountHolder ?: existing.accountHolder,
            settlementCycle = settlementCycle ?: existing.settlementCycle,
            platformCommissionRate = existing.platformCommissionRate
        )
    }
}
