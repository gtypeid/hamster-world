package com.hamsterworld.ecommerce.domain.merchant.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.merchant.constant.MerchantStatus
// import com.hamsterworld.ecommerce.domain.merchant.event.MerchantCreatedEvent  // TODO: 이벤트 발행 재개 시 주석 해제
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table

/**
 * Merchant 엔티티
 *
 * User와 1:1 관계
 * - userId: User FK (unique)
 * - businessInfo: 사업자 정보 (VO)
 * - storeInfo: 스토어 정보 (VO)
 * - settlementInfo: 정산 정보 (VO)
 * - cashGatewayMid: Cash Gateway 발급 MID (PgMerchantMapping 연결용)
 */
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
    var userId: Long,  // User FK (1:1)

    @Embedded
    var businessInfo: BusinessInfo,  // 사업자 정보 (VO)

    @Embedded
    var storeInfo: StoreInfo,  // 스토어 정보 (VO)

    @Embedded
    var settlementInfo: SettlementInfo,  // 정산 정보 (VO)

    var cashGatewayMid: String,  // Cash Gateway 발급 MID (PgMerchantMapping 연결용)

    @Enumerated(EnumType.STRING)
    var status: MerchantStatus = MerchantStatus.PENDING  // 기본값: 승인 대기
) : AbsDomain() {

    /**
     * Merchant 생성 시 이벤트 등록
     *
     * MerchantCreatedEvent는 현재 소비자가 없어 발행 중단
     * TODO: 정산/알림 서비스 추가 시 주석 해제
     *
     * @param userPublicId User의 Public ID (이벤트 발행 재개 시 사용)
     */
    @Suppress("UNUSED_PARAMETER")
    fun onCreate(userPublicId: String): Merchant {
        // registerEvent(
        //     MerchantCreatedEvent.from(this, userPublicId)
        // )
        return this
    }

    /**
     * 사업자 정보 수정
     */
    fun updateBusinessInfo(businessInfo: BusinessInfo) {
        this.businessInfo = businessInfo
    }

    /**
     * 스토어 정보 수정
     */
    fun updateStoreInfo(storeInfo: StoreInfo) {
        this.storeInfo = storeInfo
    }

    /**
     * 정산 정보 수정
     */
    fun updateSettlementInfo(settlementInfo: SettlementInfo) {
        this.settlementInfo = settlementInfo
    }
}
