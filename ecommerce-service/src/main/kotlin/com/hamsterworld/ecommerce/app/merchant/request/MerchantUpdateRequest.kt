package com.hamsterworld.ecommerce.app.merchant.request

import com.hamsterworld.ecommerce.domain.merchant.constant.SettlementCycle
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import java.math.BigDecimal

/**
 * Merchant 수정 요청
 *
 * 모든 필드가 optional (null이 아닌 필드만 업데이트)
 */
data class MerchantUpdateRequest(
    // 사업자 정보 (전체 또는 null)
    val businessName: String? = null,
    val businessNumber: String? = null,
    val representativeName: String? = null,
    val businessAddress: String? = null,
    val businessType: String? = null,

    // 스토어 정보 (전체 또는 null)
    val storeName: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val operatingHours: String? = null,
    val storeDescription: String? = null,
    val storeImageUrl: String? = null,

    // 정산 정보 (전체 또는 null)
    val bankName: String? = null,
    val accountNumber: String? = null,
    val accountHolder: String? = null,
    val settlementCycle: SettlementCycle? = null
) {
    /**
     * BusinessInfo가 업데이트되어야 하는지 확인
     */
    fun hasBusinessInfoUpdate(): Boolean {
        return businessName != null || businessNumber != null || representativeName != null ||
                businessAddress != null || businessType != null
    }

    /**
     * StoreInfo가 업데이트되어야 하는지 확인
     */
    fun hasStoreInfoUpdate(): Boolean {
        return storeName != null || contactEmail != null || contactPhone != null ||
                operatingHours != null || storeDescription != null || storeImageUrl != null
    }

    /**
     * SettlementInfo가 업데이트되어야 하는지 확인
     */
    fun hasSettlementInfoUpdate(): Boolean {
        return bankName != null || accountNumber != null || accountHolder != null || settlementCycle != null
    }

    /**
     * 기존 BusinessInfo를 기반으로 업데이트
     */
    fun toBusinessInfo(existing: BusinessInfo): BusinessInfo {
        return BusinessInfo(
            businessName = businessName ?: existing.businessName,
            businessNumber = businessNumber ?: existing.businessNumber,
            representativeName = representativeName ?: existing.representativeName,
            businessAddress = businessAddress ?: existing.businessAddress,
            businessType = businessType ?: existing.businessType
        )
    }

    /**
     * 기존 StoreInfo를 기반으로 업데이트
     */
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

    /**
     * 기존 SettlementInfo를 기반으로 업데이트
     */
    fun toSettlementInfo(existing: SettlementInfo): SettlementInfo {
        return SettlementInfo(
            bankName = bankName ?: existing.bankName,
            accountNumber = accountNumber ?: existing.accountNumber,
            accountHolder = accountHolder ?: existing.accountHolder,
            settlementCycle = settlementCycle ?: existing.settlementCycle,
            platformCommissionRate = existing.platformCommissionRate  // 플랫폼 수수료율은 관리자만 수정
        )
    }
}
