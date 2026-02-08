package com.hamsterworld.progression.domain.mission.constant

/**
 * Mission Type (조건 타입)
 *
 * Hamster World 도메인 이벤트에 대응
 */
enum class MissionType {
    // Order 관련
    CREATE_ORDER,          // OrderCreatedEvent
    COMPLETE_ORDER,        // OrderCompletedEvent (미래)

    // Product 관련
    CREATE_PRODUCT,        // ProductCreatedEvent

    // Review 관련
    CREATE_REVIEW,         // ReviewCreatedEvent (미래)

    // Payment 관련
    CONFIRM_PAYMENT,       // PaymentConfirmedEvent

    // User 관련
    USER_LOGIN,            // UserLoginEvent (미래)

    // Stat 기반 (통계 참조)
    TOTAL_PURCHASE_AMOUNT, // 총 구매액
    ORDER_COUNT,           // 주문 횟수
    PRODUCT_COUNT,         // 상품 등록 수
    REVIEW_COUNT;          // 리뷰 작성 수
}

/**
 * MissionType을 이벤트 타입 문자열로 변환
 */
fun MissionType.toEventType(): String {
    return when (this) {
        MissionType.CREATE_ORDER -> "OrderCreatedEvent"
        MissionType.COMPLETE_ORDER -> "OrderCompletedEvent"
        MissionType.CREATE_PRODUCT -> "ProductCreatedEvent"
        MissionType.CREATE_REVIEW -> "ReviewCreatedEvent"
        MissionType.CONFIRM_PAYMENT -> "PaymentConfirmedEvent"
        MissionType.USER_LOGIN -> "UserLoginEvent"
        // Stat 기반은 이벤트 없음
        else -> this.name
    }
}
