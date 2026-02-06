#!/bin/bash

# Kafka 토픽의 메시지 조회

set -e

TOPIC="${1:-ecommerce-events}"
MAX_MESSAGES="${2:-10}"

echo "=================================================="
echo "Kafka 메시지 조회"
echo "=================================================="
echo "Topic: $TOPIC"
echo "Max messages: $MAX_MESSAGES"
echo "=================================================="
echo ""

docker exec hamster-kafka kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic "$TOPIC" \
    --from-beginning \
    --max-messages "$MAX_MESSAGES" \
    --property print.timestamp=true \
    --property print.key=true \
    --property print.value=true

echo ""
echo "=================================================="
echo "✓ 완료"
echo "=================================================="
echo ""
echo "사용법:"
echo "  ./scripts/kafka-messages.sh [토픽명] [최대메시지수]"
echo ""
echo "예시:"
echo "  ./scripts/kafka-messages.sh ecommerce-events 10"
echo "  ./scripts/kafka-messages.sh payment-events 5"
echo ""
