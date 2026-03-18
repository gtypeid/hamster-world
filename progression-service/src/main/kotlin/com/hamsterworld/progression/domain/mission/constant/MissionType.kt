package com.hamsterworld.progression.domain.mission.constant

enum class MissionType {
    CREATE_ORDER,
    COMPLETE_ORDER,
    COMPLETE_DELIVERY,
    CREATE_PRODUCT,
    CREATE_REVIEW,
    CONFIRM_PAYMENT,
    USER_LOGIN,
    TOTAL_PURCHASE_AMOUNT,
    ORDER_COUNT,
    PRODUCT_COUNT,
    REVIEW_COUNT;
}

fun MissionType.toEventType(): String {
    return when (this) {
        MissionType.CREATE_ORDER -> "OrderCreatedEvent"
        MissionType.COMPLETE_ORDER -> "OrderCompletedEvent"
        MissionType.CREATE_PRODUCT -> "ProductCreatedEvent"
        MissionType.CREATE_REVIEW -> "ReviewCreatedEvent"
        MissionType.CONFIRM_PAYMENT -> "PaymentConfirmedEvent"
        MissionType.USER_LOGIN -> "UserLoginEvent"
        else -> this.name
    }
}
