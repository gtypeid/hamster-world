package com.hamsterworld.cashgateway.domain.cashgatewaymid.model

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

/**
 * CashGatewayMid (Cash Gateway 가맹점 식별자)
 *
 * **목적**: Cash Gateway가 관리하는 MID와 PG사 Provider 매핑
 *
 * **구조**:
 * - provider: PG사 (DUMMY, TOSS 등)
 * - mid: Cash Gateway MID (Cash Gateway가 발급한 가맹점 식별자)
 * - pgMid: PG MID (PG사에 등록된 실제 가맹점 ID)
 * - userKeycloakId: 이 MID의 주체 (Keycloak 유저 ID)
 * - originSource: 거래 출처 (NULL = Cash Gateway 자체, "partner-a" = 외부 파트너)
 * - isActive: 활성화 여부
 *
 * **관계**:
 * - Ecommerce Merchant.cashGatewayMid → 이 테이블의 mid
 * - provider + mid = UNIQUE (같은 PG사에 같은 MID 중복 불가)
 *
 * **MID 식별 원칙**:
 * - 외부 서비스는 Cash Gateway MID를 직접 지정하지 않음
 * - Cash Gateway가 userKeycloakId를 기반으로 해당 유저의 CashGatewayMid를 자체 조회
 * - CashGatewayMid.mid ≠ pgMid (Cash Gateway 식별자 ≠ PG사 가맹점 ID)
 */
@Entity
@Table(
    name = "cash_gateway_mids",
    uniqueConstraints = [
        UniqueConstraint(name = "uq_provider_mid", columnNames = ["provider", "mid"])
    ],
    indexes = [
        Index(name = "idx_cash_gateway_mids_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_provider_user_keycloak_id", columnList = "provider, user_keycloak_id"),
        Index(name = "idx_origin_source", columnList = "origin_source"),
        Index(name = "idx_is_active", columnList = "is_active")
    ]
)
class CashGatewayMid(

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var provider: Provider,

    @Column(nullable = false, length = 100)
    var mid: String,

    @Column(name = "pg_mid", nullable = false, length = 100)
    var pgMid: String,  // PG사에 등록된 실제 가맹점 ID (hamster-pg-service의 PgMid.midId)

    @Column(name = "user_keycloak_id", nullable = false, length = 100)
    var userKeycloakId: String,  // 이 MID의 주체 (Keycloak 유저 ID)

    @Column(name = "origin_source", length = 100)
    var originSource: String? = null,  // NULL = Cash Gateway 자체, 값 있으면 외부 파트너

    @Column(length = 255)
    var description: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
) : AbsDomain() {

    /**
     * 내부 거래 여부 (Cash Gateway 자체 MID)
     */
    fun isInternal(): Boolean = originSource == null

    /**
     * 외부 거래 여부 (파트너사 MID)
     */
    fun isExternal(): Boolean = originSource != null

    companion object {
        /**
         * Cash Gateway MID 자동 생성
         *
         * userKeycloakId + provider 조합으로 CashGatewayMid가 존재하지 않을 때,
         * 자동으로 생성하여 유저별 MID를 발급한다.
         *
         * **mid 형식**: CGW_{PROVIDER}_{TIMESTAMP}_{RANDOM}
         * **예시**: CGW_DUMMY_20260219143045_A1B2C3D4
         *
         * @param provider PG사
         * @param pgMid 매핑할 PG MID (PG사에 등록된 실제 가맹점 ID)
         * @param userKeycloakId 이 MID의 주체 (Keycloak 유저 ID)
         * @return 생성된 CashGatewayMid
         */
        fun create(
            provider: Provider,
            pgMid: String,
            userKeycloakId: String
        ): CashGatewayMid {
            val mid = generateMid(provider)
            return CashGatewayMid(
                provider = provider,
                mid = mid,
                pgMid = pgMid,
                userKeycloakId = userKeycloakId,
                originSource = null,  // 내부 거래 (Cash Gateway 자체)
                description = "Auto-created for userKeycloakId=$userKeycloakId"
            )
        }

        /**
         * Cash Gateway MID 자동 생성
         *
         * **형식**: CGW_{PROVIDER}_{TIMESTAMP}_{RANDOM}
         * **예시**: CGW_DUMMY_20260219143045_A1B2C3D4
         */
        private fun generateMid(provider: Provider): String {
            val dateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
            val random = java.util.UUID.randomUUID().toString().substring(0, 8).uppercase()
            return "CGW_${provider.name}_${dateTime}_${random}"
        }
    }
}
