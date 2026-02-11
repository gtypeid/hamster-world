package com.hamsterworld.ecommerce.domain.order.model

import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(
    name = "orders",
    indexes = [
        Index(name = "idx_orders_public_id", columnList = "public_id", unique = true)
    ]
)
class Order(
    @Column(nullable = false, name = "user_id")
    var userId: Long? = null,

    var orderNumber: String? = null,  // 고객용 주문번호 (저장 시 자동 생성)

    @Column(name = "gateway_payment_public_id", length = 20)
    var gatewayPaymentPublicId: String? = null,  // Cash Gateway Service의 Payment Public ID (Snowflake Base62)

    var price: BigDecimal? = null,

    /**
     * 할인 금액 (쿠폰 등 적용 시)
     * null이면 할인 없음
     */
    @Column(name = "discount_amount", precision = 15, scale = 3)
    var discountAmount: BigDecimal? = null,

    /**
     * 적용된 쿠폰 코드 (할인 적용 시 추적용)
     * null이면 쿠폰 미적용
     */
    @Column(name = "coupon_code", length = 50)
    var couponCode: String? = null,

    /**
     * 최종 결제 금액 (price - discountAmount)
     * 할인이 없으면 price와 동일
     */
    @Column(name = "final_price", precision = 15, scale = 3)
    var finalPrice: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: OrderStatus = OrderStatus.CREATED
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        userId: Long? = this.userId,
        orderNumber: String? = this.orderNumber,
        gatewayPaymentPublicId: String? = this.gatewayPaymentPublicId,
        price: BigDecimal? = this.price,
        discountAmount: BigDecimal? = this.discountAmount,
        couponCode: String? = this.couponCode,
        finalPrice: BigDecimal? = this.finalPrice,
        status: OrderStatus = this.status
    ): Order {
        val copied = Order(
            userId = userId,
            orderNumber = orderNumber,
            gatewayPaymentPublicId = gatewayPaymentPublicId,
            price = price,
            discountAmount = discountAmount,
            couponCode = couponCode,
            finalPrice = finalPrice,
            status = status
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    /**
     * 주문 생성 이벤트 등록
     */
    fun publishCreatedEvent(event: Any): Order {
        registerEvent(event)
        return this
    }

    /**
     * 재고 검증 실패로 주문 실패 처리
     */
    fun markAsStockValidationFailed(failureReason: String): Order {
        require(this.status == OrderStatus.CREATED) {
            "주문 상태가 CREATED가 아닙니다. 현재 상태: ${this.status}"
        }
        this.status = OrderStatus.PAYMENT_FAILED
        return this
    }

    companion object {
        /**
         * Order 생성 팩토리 메서드
         *
         * DDD 패턴: 도메인 생성 로직을 Domain 레이어에 위치
         *
         * @param userId 사용자 ID
         * @param price 상품 총액 (할인 전)
         * @param discountAmount 할인 금액 (null이면 할인 없음)
         * @param couponCode 적용된 쿠폰 코드 (null이면 쿠폰 미적용)
         * @return 생성된 Order
         */
        fun create(
            userId: Long,
            price: BigDecimal,
            discountAmount: BigDecimal? = null,
            couponCode: String? = null
        ): Order {
            val orderNumber = generateOrderNumber()
            val finalPrice = if (discountAmount != null) {
                price.subtract(discountAmount).coerceAtLeast(BigDecimal.ZERO)
            } else {
                price
            }
            return Order(
                userId = userId,
                orderNumber = orderNumber,
                price = price,
                discountAmount = discountAmount,
                couponCode = couponCode,
                finalPrice = finalPrice,
                status = OrderStatus.CREATED
            )
        }

        /**
         * 주문번호 생성 (Private)
         *
         * 형식: yyyyMMddHHmmssSSS (17자리 숫자)
         */
        private fun generateOrderNumber(): String {
            return java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
        }
    }
}
