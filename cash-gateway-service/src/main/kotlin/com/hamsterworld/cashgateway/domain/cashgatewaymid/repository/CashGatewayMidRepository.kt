package com.hamsterworld.cashgateway.domain.cashgatewaymid.repository

import com.hamsterworld.cashgateway.domain.cashgatewaymid.model.CashGatewayMid
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Repository

@Repository
class CashGatewayMidRepository(
    private val cashGatewayMidJpaRepository: CashGatewayMidJpaRepository
) {
    fun save(cashGatewayMid: CashGatewayMid): CashGatewayMid {
        return cashGatewayMidJpaRepository.save(cashGatewayMid)
    }

    fun findByProviderAndMid(provider: Provider, mid: String): CashGatewayMid? {
        return cashGatewayMidJpaRepository.findByProviderAndMidAndIsActiveTrue(provider, mid)
    }

    fun findByProviderAndMidOrThrow(provider: Provider, mid: String): CashGatewayMid {
        return findByProviderAndMid(provider, mid)
            ?: throw CustomRuntimeException(
                "유효한 CashGatewayMid를 찾을 수 없습니다. provider=$provider, mid=$mid"
            )
    }

    fun findByMid(mid: String): CashGatewayMid? {
        return cashGatewayMidJpaRepository.findByMidAndIsActiveTrue(mid)
    }

    /**
     * userKeycloakId로 해당 유저의 CashGatewayMid 조회
     *
     * 외부 서비스가 Cash Gateway MID를 직접 지정하지 않고,
     * Cash Gateway가 userKeycloakId를 기반으로 자체 조회하는 핵심 메서드.
     */
    fun findByProviderAndUserKeycloakId(provider: Provider, userKeycloakId: String): CashGatewayMid? {
        return cashGatewayMidJpaRepository.findByProviderAndUserKeycloakIdAndIsActiveTrue(provider, userKeycloakId)
    }

    fun findByProviderAndUserKeycloakIdOrThrow(provider: Provider, userKeycloakId: String): CashGatewayMid {
        return findByProviderAndUserKeycloakId(provider, userKeycloakId)
            ?: throw CustomRuntimeException(
                "유효한 CashGatewayMid를 찾을 수 없습니다. provider=$provider, userKeycloakId=$userKeycloakId"
            )
    }

    /**
     * PG MID로 Cash Gateway MID 후보 목록 역추적
     *
     * PG사 Webhook 응답의 midId(PG MID)로부터 매핑된 Cash Gateway MID 목록을 찾는다.
     * N:1 관계 (여러 Cash Gateway MID → 하나의 PG MID)이므로 복수 결과 가능.
     *
     * @param provider PG사
     * @param pgMid PG MID (PG사에 등록된 가맹점 ID)
     * @return 매핑된 CashGatewayMid 엔티티 목록
     */
    fun findAllByProviderAndPgMid(provider: Provider, pgMid: String): List<CashGatewayMid> {
        return cashGatewayMidJpaRepository.findByProviderAndPgMidAndIsActiveTrue(provider, pgMid)
    }

    /**
     * PG MID + userKeycloakId로 CashGatewayMid 1개 특정
     *
     * Webhook Step 2에서 후보가 복수일 때 userId로 필터링하여 정확히 1개를 찾는다.
     *
     * @param provider PG사
     * @param pgMid PG MID
     * @param userKeycloakId 유저의 Keycloak Subject ID
     * @return 매칭되는 CashGatewayMid, 없으면 null
     */
    fun findByProviderAndPgMidAndUserKeycloakId(
        provider: Provider,
        pgMid: String,
        userKeycloakId: String
    ): CashGatewayMid? {
        return cashGatewayMidJpaRepository
            .findByProviderAndPgMidAndUserKeycloakIdAndIsActiveTrue(provider, pgMid, userKeycloakId)
    }
}
