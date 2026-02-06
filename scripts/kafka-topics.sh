#!/bin/bash

# Kafka 토픽 목록 및 상세 정보 조회

set -e

echo "=================================================="
echo "Kafka 토픽 목록"
echo "=================================================="

docker exec hamster-kafka kafka-topics \
    --bootstrap-server kafka:9092 \
    --list

echo ""
echo "=================================================="
echo "토픽 상세 정보"
echo "=================================================="

# 모든 토픽에 대해 상세 정보 출력
for topic in $(docker exec hamster-kafka kafka-topics --bootstrap-server kafka:9092 --list 2>/dev/null); do
    echo ""
    echo "--- $topic ---"
    docker exec hamster-kafka kafka-topics \
        --bootstrap-server kafka:9092 \
        --describe \
        --topic "$topic"
done

echo ""
echo "=================================================="
echo "Consumer Group 목록"
echo "=================================================="

docker exec hamster-kafka kafka-consumer-groups \
    --bootstrap-server kafka:9092 \
    --list

echo ""
