package com.hamsterworld.ecommerce.consumer

import java.math.BigDecimal

/**
 * AccountBalanceSynchronizedEvent DTO (from Payment Service)
 *
 * Payment Service에서 발행하는 잔액 동기화 이벤트를 역직렬화하기 위한 DTO
 *
 * ## 필드 설명
 * - accountPublicId: Payment Service의 Account publicId (Snowflake Base62)
 * - userPublicId: User publicId (Snowflake Base62) — 이커머스 User 조회용
 * - accountType: 계좌 유형 (CONSUMER, MERCHANT, RIDER)
 * - balance: 현재 잔액 (절대값)
 * - reason: 잔액 변경 사유
 */
data class AccountBalanceSynchronizedEventDto(
    val accountPublicId: String,
    val userPublicId: String,
    val accountType: String,
    val balance: BigDecimal,
    val reason: String
)
