package com.hamsterworld.ecommerce.domain.merchant.service

import com.hamsterworld.common.external.keycloak.client.KeycloakAdminClient
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.common.domain.auth.UserRole
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MerchantService(
    private val merchantRepository: MerchantRepository,
    private val userRepository: com.hamsterworld.ecommerce.domain.user.repository.UserRepository,
    private val keycloakAdminClient: KeycloakAdminClient
) {
    private val log = LoggerFactory.getLogger(MerchantService::class.java)

    /**
     * Merchant 생성
     *
     * 1. userId 중복 체크 (User 1:1 Merchant)
     * 2. Merchant 생성
     * 3. User Role을 MERCHANT로 변경 (Keycloak + Local DB)
     * 4. MerchantCreatedEvent 발행 (onCreate)
     */
    @Transactional
    fun createMerchant(
        userId: Long,
        businessInfo: BusinessInfo,
        storeInfo: StoreInfo,
        settlementInfo: SettlementInfo
    ): Merchant {
        // 1. 이미 Merchant가 존재하는지 체크
        val existing = merchantRepository.findByUserId(userId)
        if (existing != null) {
            throw CustomRuntimeException("이미 Merchant가 존재합니다. User ID: $userId")
        }

        // 2. User 조회
        val user = userRepository.findById(userId)

        // TODO: cashGatewayMid 생성 로직 (Cash Gateway 연동)
        val cashGatewayMid = "CGW_${System.currentTimeMillis()}"  // 임시

        // 3. Merchant 생성
        val merchant = Merchant(
            userId = userId,
            businessInfo = businessInfo,
            storeInfo = storeInfo,
            settlementInfo = settlementInfo,
            cashGatewayMid = cashGatewayMid
        ).onCreate(user.publicId)  // 이벤트 등록 (save 시 자동 발행)

        val savedMerchant = merchantRepository.save(merchant)

        // 4. User Role을 MERCHANT로 변경 (Keycloak)
        try {
            keycloakAdminClient.assignRealmRole(user.keycloakUserId, UserRole.MERCHANT.keycloakRoleName)
            log.info(
                "[Keycloak Role 할당 성공] keycloakUserId={}, role={}",
                user.keycloakUserId, UserRole.MERCHANT.keycloakRoleName
            )
        } catch (e: Exception) {
            log.error(
                "[Keycloak Role 할당 실패] keycloakUserId={}, role={}",
                user.keycloakUserId, UserRole.MERCHANT.keycloakRoleName, e
            )
            throw CustomRuntimeException("Keycloak Role 할당 실패: ${e.message}", e)
        }

        // 5. Local DB의 User Role도 변경
        user.role = UserRole.MERCHANT
        userRepository.update(user)

        log.info(
            "[Merchant 생성 완료] merchantId={}, userId={}, storeName={}, businessNumber={}, cashGatewayMid={}, userRole={}",
            savedMerchant.id, savedMerchant.userId, savedMerchant.storeInfo.storeName,
            savedMerchant.businessInfo.businessNumber, savedMerchant.cashGatewayMid, user.role
        )

        return savedMerchant
    }

    /**
     * Merchant 조회 (by userId)
     */
    @Transactional(readOnly = true)
    fun findByUserId(userId: Long): Merchant? {
        return merchantRepository.findByUserId(userId)
    }

    /**
     * Merchant 조회 (by publicId)
     */
    @Transactional(readOnly = true)
    fun findByPublicId(publicId: String): Merchant {
        return merchantRepository.findByPublicId(publicId)
    }

    /**
     * Merchant 정보 수정
     */
    @Transactional
    fun updateMerchant(
        merchantId: Long,
        businessInfo: BusinessInfo?,
        storeInfo: StoreInfo?,
        settlementInfo: SettlementInfo?
    ): Merchant {
        val merchant = merchantRepository.findById(merchantId)

        // 각 정보 선택적 업데이트
        businessInfo?.let { merchant.updateBusinessInfo(it) }
        storeInfo?.let { merchant.updateStoreInfo(it) }
        settlementInfo?.let { merchant.updateSettlementInfo(it) }

        val updatedMerchant = merchantRepository.update(merchant)

        log.info(
            "[Merchant 수정 완료] merchantId={}, userId={}, storeName={}",
            updatedMerchant.id, updatedMerchant.userId, updatedMerchant.storeInfo.storeName
        )

        return updatedMerchant
    }
}
