package com.hamsterworld.payment.domain.ordersnapshot.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.product.event.OrderStockReservedEvent
import com.hamsterworld.payment.domain.product.event.OrderItemDto as ProductEventOrderItemDto
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

/**
 * Order Snapshot (Rich Domain Model)
 *
 * **목적**: 결제 취소 시 재고 복원을 위해 주문 항목 정보를 DB에 저장
 *
 * **생명 주기**:
 * - 재고 검증 및 차감 성공 후 createCompleted()로 생성
 * - OrderStockReservedEvent 발행 → Cash Gateway에 PG 요청 지시
 * - PaymentCancelledEvent 처리 시 조회 후 재고 복원
 *
 * **저장 위치**:
 * - product_order_snapshots (부모)
 * - product_order_snapshot_items (자식, 관계 없음)
 *
 * **관계**: OrderSnapshotItem과 논리적 관계만 존재 (물리적 FK 없음)
 *
 * **주의**: items는 별도 테이블에 저장됨. 필요 시 OrderSnapshotWithItems 사용
 */
@Entity
@Table(
    name = "product_order_snapshots",
    indexes = [
        Index(name = "idx_order_public_id", columnList = "order_public_id", unique = true),
        Index(name = "idx_order_number", columnList = "order_number")
    ]
)
class OrderSnapshot(
    @Column(name = "order_public_id", nullable = false, length = 20)
    var orderPublicId: String,  // E-commerce Service Order의 Public ID (Snowflake Base62)

    @Column(name = "order_number", nullable = false)
    var orderNumber: String,

    @Column(name = "user_public_id", nullable = false, length = 20)
    var userPublicId: String,  // User의 Public ID (Snowflake Base62, 내부 서비스용)

    @Column(name = "user_keycloak_id", nullable = false, length = 100)
    var userKeycloakId: String,  // User의 Keycloak Subject ID (외부 시스템 UUID)

    @Column(name = "total_price", nullable = false, precision = 15, scale = 3)
    var totalPrice: BigDecimal,

    @Column(name = "coupon_discount", nullable = false, precision = 15, scale = 3)
    var couponDiscount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "points_used", nullable = false, precision = 15, scale = 3)
    var pointsUsed: BigDecimal = BigDecimal.ZERO,

    @Column(name = "cash_amount", nullable = false, precision = 15, scale = 3)
    var cashAmount: BigDecimal = BigDecimal.ZERO
) : AbsDomain() {

    companion object {
        /**
         * OrderSnapshot 생성 (재고 검증 및 차감 성공 후)
         *
         * ## 발행 이벤트
         * - OrderStockReservedEvent: Cash Gateway에 PG 요청 지시
         *
         * ## 도메인 의미
         * - OrderSnapshot 생성 = 재고 차감 완료 = 결제 진행 가능 상태
         * - 여러 상품의 재고 차감이 모두 성공했음을 하나로 묶어서 표현
         *
         * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
         * @param orderNumber 주문 번호
         * @param userPublicId User의 Public ID (Snowflake Base62, 내부 서비스용)
         * @param userKeycloakId User의 Keycloak Subject ID (외부 시스템 UUID)
         * @param totalPrice 총 주문 금액
         * @param items 주문 항목 리스트
         * @return OrderSnapshot (이벤트 등록됨)
         */
        fun createCompleted(
            orderPublicId: String,
            orderNumber: String,
            userPublicId: String,
            userKeycloakId: String,
            totalPrice: BigDecimal,
            couponDiscount: BigDecimal,
            pointsUsed: BigDecimal,
            cashAmount: BigDecimal,
            items: List<OrderItemDto>
        ): OrderSnapshot {
            val snapshot = OrderSnapshot(
                orderPublicId = orderPublicId,
                orderNumber = orderNumber,
                userPublicId = userPublicId,
                userKeycloakId = userKeycloakId,
                totalPrice = totalPrice,
                couponDiscount = couponDiscount,
                pointsUsed = pointsUsed,
                cashAmount = cashAmount
            )

            // OrderStockReservedEvent 발행 (Cash Gateway에 PG 요청 지시)
            snapshot.registerEvent(
                OrderStockReservedEvent(
                    orderPublicId = orderPublicId,
                    userPublicId = userPublicId,
                    userKeycloakId = userKeycloakId,
                    orderNumber = orderNumber,
                    totalPrice = totalPrice,
                    couponDiscount = couponDiscount,
                    pointsUsed = pointsUsed,
                    cashAmount = cashAmount,
                    items = items.map { item ->
                        ProductEventOrderItemDto(
                            productId = item.productPublicId,
                            merchantPublicId = item.merchantPublicId,
                            quantity = item.quantity,
                            price = item.price
                        )
                    }
                )
            )

            return snapshot
        }
    }
}
