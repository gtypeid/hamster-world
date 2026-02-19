package com.hamsterworld.cashgateway.consumer

import java.math.BigDecimal

/**
 * OrderStockReservedEvent DTO (Payment Service → Cash-Gateway Service)
 *
 * ## 수신 시점
 * - Payment Service에서 재고 검증 + 차감 성공 시 (선차감 완료)
 *
 * ## 처리 내용
 * - PaymentAttempt 생성
 * - PG 결제 요청 (cashAmount 기준)
 *
 * ## 금액
 * - cashAmount: 실제 PG 결제 금액 (= totalPrice - couponDiscount - pointsUsed)
 * - Cash-Gateway는 cashAmount만 알면 됨 (totalPrice, 할인 내역은 Payment Service 책임)
 */
data class OrderStockReservedEventDto(
    val orderPublicId: String,  // E-commerce Service의 Order Public ID (Snowflake Base62)
    val userKeycloakId: String,  // User의 Keycloak Subject ID (외부 시스템 UUID)
    val orderNumber: String,
    val cashAmount: BigDecimal, // 실제 PG 결제 금액
    val items: List<OrderItemDto>
)

data class OrderItemDto(
    val productId: String,            // Product의 Public ID (Snowflake Base62)
    val merchantPublicId: String,     // Merchant의 Public ID (Snowflake Base62)
    val quantity: Int,
    val price: BigDecimal
)
