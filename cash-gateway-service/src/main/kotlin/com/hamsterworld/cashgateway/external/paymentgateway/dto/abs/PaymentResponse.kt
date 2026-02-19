package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import java.math.BigDecimal

/**
 * 모든 PG사 공통이라 간주
 */
interface PaymentResponse {
    /**
     * 응답 코드
     */
    fun getCode(): String

    /**
     * 거래 식별자 (PG Transaction)
     */
    fun getPgTransaction(): String?

    /**
     * 승인 번호
     */
    fun getPgApprovalNo(): String?

    /**
     * 응답 메시지
     */
    fun getMessage(): String

    /**
     * 거래 금액
     *
     * 외부 거래 기록 시 필요
     */
    fun getAmount(): BigDecimal?

    fun isSuccess(): Boolean {
        return false
    }

    /**
     * PG 응답의 MID (PG사에 등록된 가맹점 ID)
     *
     * Webhook에서 PG MID → CashGatewayMid 역추적에 사용.
     * PG사마다 응답 필드명이 다를 수 있으므로 각 Provider가 구현.
     */
    fun getMid(): String? {
        return null
    }

    /**
     * PG 응답의 유저 식별자
     *
     * PG사 관점에서는 userId이지만, Cash Gateway 내부에서는 userKeycloakId에 해당한다.
     * (Cash Gateway에 결제 요청 시 keycloakId를 userId로 전달하기 때문)
     *
     * Webhook Step 2에서 CashGatewayMid 후보 필터링에 사용:
     * CashGatewayMid 후보가 복수일 때 이 값으로 정확히 1개를 특정.
     *
     * @return PG 응답의 userId (= Cash Gateway의 userKeycloakId)
     */
    fun getUserId(): String? {
        return null
    }

    /**
     * PG가 echo-back한 데이터
     *
     * 요청 시 보낸 echo를 PG가 응답에 그대로 돌려주는 경우 사용.
     * Webhook에서 원본 PaymentProcess를 찾기 위한 키로 활용할 수 있다.
     */
    fun getEcho(): Map<String, Any?> {
        return emptyMap()
    }
}
