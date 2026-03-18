package com.hamsterworld.ecommerce.domain.merchant.service
import com.hamsterworld.common.external.keycloak.client.KeycloakAdminClient
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.merchant.response.MerchantResponse
import com.hamsterworld.ecommerce.app.merchant.response.MerchantSellerInfoResponse
import com.hamsterworld.ecommerce.domain.merchant.model.BusinessInfo
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.merchant.model.SettlementInfo
import com.hamsterworld.ecommerce.domain.merchant.model.StoreInfo
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import com.hamsterworld.common.domain.auth.UserRole
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
@Service
class MerchantService(
    private val merchantRepository: MerchantRepository,
    private val userRepository: UserRepository,
    private val keycloakAdminClient: KeycloakAdminClient
) {
    private val log = LoggerFactory.getLogger(MerchantService::class.java)
    @Transactional
    fun createMerchant(
        userId: Long,
        businessInfo: BusinessInfo,
        storeInfo: StoreInfo,
        settlementInfo: SettlementInfo
    ): Merchant {
        val existing = merchantRepository.findByUserId(userId)
        if (existing != null) {
            throw CustomRuntimeException("이미 Merchant가 존재합니다. User ID: $userId")
        }
        val user = userRepository.findById(userId)
        val cashGatewayMid = "CGW_${System.currentTimeMillis()}"
        val merchant = Merchant(
            userId = userId,
            businessInfo = businessInfo,
            storeInfo = storeInfo,
            settlementInfo = settlementInfo,
            cashGatewayMid = cashGatewayMid
        ).onCreate(user.publicId)
        val savedMerchant = merchantRepository.save(merchant)
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
        user.role = UserRole.MERCHANT
        userRepository.update(user)
        log.info(
            "[Merchant 생성 완료] merchantId={}, userId={}, storeName={}, businessNumber={}, cashGatewayMid={}, userRole={}",
            savedMerchant.id, savedMerchant.userId, savedMerchant.storeInfo.storeName,
            savedMerchant.businessInfo.businessNumber, savedMerchant.cashGatewayMid, user.role
        )
        return savedMerchant
    }
    @Transactional(readOnly = true)
    fun findByUserId(userId: Long): Merchant? {
        return merchantRepository.findByUserId(userId)
    }
    @Transactional(readOnly = true)
    fun findByPublicId(publicId: String): Merchant {
        return merchantRepository.findByPublicId(publicId)
    }
    @Transactional
    fun updateMerchant(
        merchantId: Long,
        businessInfo: BusinessInfo?,
        storeInfo: StoreInfo?,
        settlementInfo: SettlementInfo?
    ): Merchant {
        val merchant = merchantRepository.findById(merchantId)
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
    @Transactional
    fun createMerchantResponse(
        userId: Long,
        userPublicId: String,
        businessInfo: BusinessInfo,
        storeInfo: StoreInfo,
        settlementInfo: SettlementInfo
    ): MerchantResponse {
        val merchant = createMerchant(userId, businessInfo, storeInfo, settlementInfo)
        return MerchantResponse.from(merchant, userPublicId)
    }
    @Transactional(readOnly = true)
    fun getMerchantResponseByUserId(userId: Long, userPublicId: String): MerchantResponse? {
        val merchant = merchantRepository.findByUserId(userId)
        return merchant?.let { MerchantResponse.from(it, userPublicId) }
    }
    @Transactional(readOnly = true)
    fun getMerchantSellerInfoByPublicId(publicId: String): MerchantSellerInfoResponse {
        val merchant = merchantRepository.findByPublicId(publicId)
        return MerchantSellerInfoResponse.from(merchant)
    }
    @Transactional
    fun updateMerchantResponse(
        merchantId: Long,
        userPublicId: String,
        businessInfo: BusinessInfo?,
        storeInfo: StoreInfo?,
        settlementInfo: SettlementInfo?
    ): MerchantResponse {
        val merchant = updateMerchant(merchantId, businessInfo, storeInfo, settlementInfo)
        return MerchantResponse.from(merchant, userPublicId)
    }
}
