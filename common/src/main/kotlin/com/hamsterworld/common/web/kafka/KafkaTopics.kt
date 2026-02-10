package com.hamsterworld.common.web.kafka

/**
 * Kafka 토픽 이름 상수
 *
 * 모든 서비스에서 참조하는 토픽 이름을 한 곳에서 관리합니다.
 * Consumer의 @KafkaListener, BaseKafkaConsumer 생성자 등에서 사용합니다.
 *
 * 토픽의 메타데이터 (파티션, 복제팩터, 소유자)는 kafka-topology.yml에서 관리하며
 * EventRegistryValidator가 시작 시 검증합니다.
 *
 * ## 왜 @ConfigurationProperties가 아닌 상수인가?
 *
 * 기존에는 kafka-topology.yml의 토픽 정보를 Spring Property로 등록(KafkaTopologyPropertyRegistrar)한 뒤,
 * kafka-event-registry.yml에서 `${kafka.topics.xxx}` placeholder로 참조하는 구조였습니다.
 * 그런데 @ConfigurationProperties 바인딩 시점에 placeholder가 해결되지 않는 문제가 있어
 * BeanPostProcessor(EventRegistryPropertiesPostProcessor)로 모든 빈을 순회하며
 * 후처리하는 방식을 사용했습니다.
 *
 * 토픽 이름 하나 참조하기 위해 Spring 빈 라이프사이클에 깊이 개입하는 것은 과도한 복잡도였으므로,
 * 단순한 상수 객체로 대체했습니다. 토픽 이름은 인프라 레벨 설정으로 거의 변경되지 않으며,
 * EventRegistryValidator가 kafka-topology.yml과 대조 검증하므로 오타/미등록 토픽은
 * 애플리케이션 시작 시 감지됩니다.
 */
object KafkaTopics {
    const val ECOMMERCE_EVENTS = "ecommerce-events"
    const val PAYMENT_EVENTS = "payment-events"
    const val CASH_GATEWAY_EVENTS = "cash-gateway-events"
    const val PROGRESSION_EVENTS = "progression-events"
}
