업#!/bin/bash

# Kafka Consumer Group 상세 정보 조회

set -e

GROUP="${1}"

if [ -z "$GROUP" ]; then
    echo "=================================================="
    echo "Kafka Consumer Group 목록"
    echo "=================================================="

    docker exec hamster-kafka kafka-consumer-groups \
        --bootstrap-server kafka:9092 \
        --list

    echo ""
    echo "=================================================="
    echo "사용법:"
    echo "  ./scripts/kafka-consumer-groups.sh [그룹명]"
    echo ""
    echo "예시:"
    echo "  ./scripts/kafka-consumer-groups.sh payment-service-group"
    echo ""
else
    echo "=================================================="
    echo "Consumer Group: $GROUP"
    echo "=================================================="

    docker exec hamster-kafka kafka-consumer-groups \
        --bootstrap-server kafka:9092 \
        --group "$GROUP" \
        --describe

    echo ""
fi
