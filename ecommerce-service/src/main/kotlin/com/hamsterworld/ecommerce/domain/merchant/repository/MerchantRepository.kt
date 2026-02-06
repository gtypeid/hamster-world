package com.hamsterworld.ecommerce.domain.merchant.repository

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class MerchantRepository(
    private val merchantJpaRepository: MerchantJpaRepository
) {
    private val log = LoggerFactory.getLogger(MerchantRepository::class.java)

    fun save(merchant: Merchant): Merchant {
        return merchantJpaRepository.save(merchant)
    }

    fun findById(id: Long): Merchant {
        return merchantJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("Merchant를 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): Merchant {
        return merchantJpaRepository.findByPublicId(publicId)
            ?: throw CustomRuntimeException("Merchant를 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findByUserId(userId: Long): Merchant? {
        return merchantJpaRepository.findByUserId(userId)
    }

    fun findByUserIdOrThrow(userId: Long): Merchant {
        return findByUserId(userId)
            ?: throw CustomRuntimeException("Merchant를 찾을 수 없습니다. User ID: $userId")
    }

    fun findByCashGatewayMid(cashGatewayMid: String): Merchant? {
        return merchantJpaRepository.findByCashGatewayMid(cashGatewayMid)
    }

    fun update(merchant: Merchant): Merchant {
        merchant.modifiedAt = LocalDateTime.now()
        return merchantJpaRepository.save(merchant)
    }
}
