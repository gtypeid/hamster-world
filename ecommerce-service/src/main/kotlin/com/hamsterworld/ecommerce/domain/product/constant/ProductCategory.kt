package com.hamsterworld.ecommerce.domain.product.constant

/**
 * 햄스터 상품 카테고리
 *
 * 프론트엔드와 동기화된 카테고리
 */
enum class ProductCategory(val displayName: String, val emoji: String) {
    FOOD("간식", "🌰"),           // 도토리, 해바라기씨 등
    FURNITURE("집/용품", "🏠"),    // 아늑한 햄스터 하우스
    SPORTS("운동기구", "🎡"),      // 쳇바퀴, 터널 등
    BEDDING("침구", "🛏️"),        // 톱밥, 목화 등
    TOYS("장난감", "🎾")          // 재미있는 놀이용품
}
