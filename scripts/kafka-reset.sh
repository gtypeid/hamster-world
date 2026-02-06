#!/bin/bash

# Kafka 완전 초기화 스크립트
# - Kafka 컨테이너 중지 및 삭제
# - Kafka 데이터 볼륨 삭제 (토픽/메시지 모두 삭제)
# - Kafka 재시작

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================="
echo "Kafka 완전 초기화 시작"
echo "=================================================="

cd "$PROJECT_ROOT"

# 1. Kafka 컨테이너 중지
echo ""
echo "[1/4] Kafka 컨테이너 중지 중..."
docker-compose stop kafka kafka-ui

# 2. Kafka 컨테이너 삭제
echo ""
echo "[2/4] Kafka 컨테이너 삭제 중..."
docker-compose rm -f kafka kafka-ui

# 3. Kafka 데이터 볼륨 삭제
echo ""
echo "[3/4] Kafka 데이터 삭제 중..."
if [ -d "./.local/kafka" ]; then
    rm -rf ./.local/kafka/*
    echo "✓ Kafka 데이터 삭제 완료: ./.local/kafka/*"
else
    echo "⚠ Kafka 데이터 디렉토리가 존재하지 않습니다."
fi

# 4. Kafka 재시작
echo ""
echo "[4/4] Kafka 재시작 중..."
docker-compose up -d kafka kafka-ui

# 5. Kafka 기동 대기 및 Health Check
echo ""
echo "Kafka 기동 대기 중..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec hamster-kafka kafka-broker-api-versions --bootstrap-server kafka:9092 &>/dev/null; then
        echo "✓ Kafka 준비 완료!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -ne "\r대기 중... (${RETRY_COUNT}/${MAX_RETRIES}초)"
    sleep 1
done
echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠ Kafka 기동 시간 초과. 수동으로 확인이 필요합니다."
    echo "   docker logs hamster-kafka"
    exit 1
fi

# 6. Kafka 상태 확인
echo ""
echo "=================================================="
echo "Kafka 상태 확인"
echo "=================================================="
docker ps --filter "name=hamster-kafka" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=================================================="
echo "토픽 목록 확인 (초기에는 __consumer_offsets만 있음)"
echo "=================================================="
docker exec hamster-kafka kafka-topics \
    --bootstrap-server kafka:9092 \
    --list || echo "⚠ Kafka가 아직 준비되지 않았습니다. 잠시 후 다시 시도하세요."

echo ""
echo "=================================================="
echo "✓ Kafka 초기화 완료!"
echo "=================================================="
echo ""
echo "다음 단계:"
echo "  1. Ecommerce Service 실행: ./gradlew :ecommerce-service:bootRun"
echo "  2. Payment Service 실행: ./gradlew :payment-service:bootRun"
echo "  3. Kafka UI 확인: http://localhost:8989"
echo ""
