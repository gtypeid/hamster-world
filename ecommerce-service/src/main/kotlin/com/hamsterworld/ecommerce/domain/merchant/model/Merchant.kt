package com.hamsterworld.ecommerce.domain.merchant.model
import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
@Entity
@Table(
    name = "merchants",
    indexes = [
        Index(name = "idx_merchants_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_merchants_user_id", columnList = "userId", unique = true),
        Index(name = "idx_merchants_cash_gateway_mid", columnList = "cashGatewayMid", unique = true)
    ]
)
class Merchant(
    var userId: Long,
    @Embedded
    var businessInfo: BusinessInfo,
    @Embedded
    var storeInfo: StoreInfo,
    @Embedded
    var settlementInfo: SettlementInfo,
    var cashGatewayMid: String,
    @Enumerated(EnumType.STRING)
    var status: MerchantStatus = MerchantStatus.PENDING
) : AbsDomain() {
    @Suppress("UNUSED_PARAMETER")
    fun onCreate(userPublicId: String): Merchant {
        return this
    }
    fun updateBusinessInfo(businessInfo: BusinessInfo) {
        this.businessInfo = businessInfo
    }
    fun updateStoreInfo(storeInfo: StoreInfo) {
        this.storeInfo = storeInfo
    }
    fun updateSettlementInfo(settlementInfo: SettlementInfo) {
        this.settlementInfo = settlementInfo
    }
}
