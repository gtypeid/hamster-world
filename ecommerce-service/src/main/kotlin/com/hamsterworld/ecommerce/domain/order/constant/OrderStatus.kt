package com.hamsterworld.ecommerce.domain.order.constant

/*
    승인 -> 취소요청 단계 삭제
 */
enum class OrderStatus {
    CREATED,
    PAYMENT_REQUESTED,
    PAYMENT_APPROVED,
    PAYMENT_FAILED,
    CANCELED;

    fun canTransitionTo(target: OrderStatus): Boolean {
        return when (this) {
            CREATED -> target == PAYMENT_FAILED || target == PAYMENT_APPROVED
            PAYMENT_APPROVED -> target == CANCELED
            else -> false
        }
    }
}
