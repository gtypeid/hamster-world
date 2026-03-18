package com.hamsterworld.ecommerce.app.merchant.request
import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import java.math.BigDecimal
data class MerchantCreateRequest(
    val businessName: String,
    val businessNumber: String,
    val representativeName: String,
    val businessAddress: String? = null,
    val businessType: String? = null,
    val storeName: String,
    val contactEmail: String,
    val contactPhone: String,
    val operatingHours: String? = null,
    val storeDescription: String? = null,
    val storeImageUrl: String? = null,
    val bankName: String,
    val accountNumber: String,
    val accountHolder: String,
    val settlementCycle: SettlementCycle = SettlementCycle.WEEKLY
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
