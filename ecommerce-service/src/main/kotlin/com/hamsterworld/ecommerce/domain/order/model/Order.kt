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
        status: OrderStatus = this.status
    ): Order {
        val copied = Order(
            userId = userId,
            orderNumber = orderNumber,
            gatewayPaymentPublicId = gatewayPaymentPublicId,
            price = price,
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
}
