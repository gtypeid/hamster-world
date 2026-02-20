#!/bin/bash
# E2E 주문 플로우 테스트 스크립트
# 상품 생성(MERCHANT) -> 장바구니 -> 주문 -> Kafka 이벤트 체인 -> DB 확인
#
# 사전 조건:
#   - Docker 인프라 (MySQL, Kafka, Keycloak) 실행 중
#   - 4개 서비스 실행 중 (ecommerce:8080, payment:8081, cash-gateway:8082, hamster-pg:8083)
#   - Keycloak realm: hamster-world, client: ecommerce
#   - 유저: ve(MERCHANT), test(일반 사용자)
#
# 사용법:
#   chmod +x scripts/e2e-order-flow.sh
#   ./scripts/e2e-order-flow.sh
#   ./scripts/e2e-order-flow.sh --wait 30   # 이벤트 대기 시간 변경 (기본 20초)

set -uo pipefail

# --- 설정 ---
KEYCLOAK_URL="http://localhost:8090"
ECOMMERCE_URL="http://localhost:8080"
REALM="hamster-world"
CLIENT_ID="ecommerce"
MERCHANT_USER="ve"
BUYER_USER="test"
USER_PASSWORD="1234"
DB_PASSWORD='12555!@'
WAIT_SECONDS="${1:-20}"

if [ "${1:-}" = "--wait" ]; then
  WAIT_SECONDS="${2:-20}"
fi

# --- 헬퍼 함수 ---
mysql_query() {
  local container="$1"
  local db="$2"
  local query="$3"
  docker exec "$container" sh -c "echo '[client]
password=${DB_PASSWORD}' > /tmp/my.cnf && mysql --defaults-extra-file=/tmp/my.cnf -uroot $db -e \"$query\"" 2>/dev/null
}

mysql_query_raw() {
  local container="$1"
  local db="$2"
  local query="$3"
  docker exec "$container" sh -c "echo '[client]
password=${DB_PASSWORD}' > /tmp/my.cnf && mysql --defaults-extra-file=/tmp/my.cnf -uroot $db -N -e \"$query\"" 2>/dev/null
}

get_token() {
  local username="$1"
  curl -sf -X POST "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "grant_type=password" \
    --data-urlencode "client_id=${CLIENT_ID}" \
    --data-urlencode "username=${username}" \
    --data-urlencode "password=${USER_PASSWORD}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"
}

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d${1})" 2>/dev/null
}

# --- 시작 ---
echo "=========================================="
echo " E2E Order Flow Test"
echo "=========================================="
echo ""

# 1. 서비스 헬스 체크
echo "[1/8] Service health check..."
ALL_UP=true
for port in 8080 8081 8082 8083; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}/actuator/health" 2>/dev/null || echo "000")
  if [ "$STATUS" != "200" ]; then
    echo "  FAIL: port ${port} returned ${STATUS}"
    ALL_UP=false
  fi
done
if [ "$ALL_UP" = true ]; then
  echo "  OK: all services healthy"
else
  echo "  ERROR: some services are down. Aborting."
  exit 1
fi

# 2. Keycloak 토큰 발급
echo "[2/8] Keycloak token..."
MERCHANT_TOKEN=$(get_token "$MERCHANT_USER")
BUYER_TOKEN=$(get_token "$BUYER_USER")
echo "  MERCHANT (${MERCHANT_USER}): ${MERCHANT_TOKEN:0:20}..."
echo "  BUYER    (${BUYER_USER}): ${BUYER_TOKEN:0:20}..."

# 3. 상품 생성 (MERCHANT)
echo "[3/8] Create product (MERCHANT)..."
PRODUCT_RESP=$(curl -sf -X POST "${ECOMMERCE_URL}/api/merchant/products" \
  -H "Authorization: Bearer ${MERCHANT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "E2E-TEST-001",
    "name": "E2E Test Product",
    "description": "PaymentProcess flow test",
    "category": "FOOD",
    "price": 10000,
    "initialStock": 100
  }')
PRODUCT_PUBLIC_ID=$(echo "$PRODUCT_RESP" | json_field "['publicId']")
echo "  Product publicId: ${PRODUCT_PUBLIC_ID}"
echo "  Response: $(echo "$PRODUCT_RESP" | python3 -m json.tool 2>/dev/null | head -5)"

# 4. 장바구니 설정 (BUYER)
echo "[4/8] Set cart items (BUYER)..."
CART_RESP=$(curl -sf -X PUT "${ECOMMERCE_URL}/api/carts" \
  -H "Authorization: Bearer ${BUYER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {\"productPublicId\": \"${PRODUCT_PUBLIC_ID}\", \"quantity\": 2}
    ]
  }")
echo "  Cart updated: $(echo "$CART_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'items={len(d.get(\"items\", []))}')" 2>/dev/null || echo "$CART_RESP")"

# 5. 주문 생성 (BUYER)
echo "[5/8] Create order (BUYER)..."
ORDER_RESP=$(curl -sf -X POST "${ECOMMERCE_URL}/api/orders" \
  -H "Authorization: Bearer ${BUYER_TOKEN}" \
  -H "Content-Type: application/json")
ORDER_PUBLIC_ID=$(echo "$ORDER_RESP" | json_field ".get('order',{}).get('publicId', 'N/A')" 2>/dev/null || echo "PARSE_FAIL")
ORDER_STATUS=$(echo "$ORDER_RESP" | json_field ".get('order',{}).get('status', 'N/A')" 2>/dev/null || echo "PARSE_FAIL")
echo "  Order publicId: ${ORDER_PUBLIC_ID}"
echo "  Order status: ${ORDER_STATUS}"
echo "  Response: $(echo "$ORDER_RESP" | python3 -m json.tool 2>/dev/null | head -8)"

# 6. 이벤트 처리 대기
echo "[6/8] Waiting ${WAIT_SECONDS}s for Kafka event chain..."
echo "  OrderCreatedEvent -> OrderStockReservedEvent -> PaymentProcess(UNKNOWN) -> Polling -> PG -> Webhook"
sleep "$WAIT_SECONDS"

# 7. DB 확인
echo "[7/8] Database verification..."
echo ""

echo "  --- ecommerce: orders ---"
mysql_query hamster-ecommerce-db ecommerce_db \
  "SELECT public_id, status, price, final_price FROM orders ORDER BY id DESC LIMIT 3;"

echo ""
echo "  --- payment: product_order_snapshots ---"
mysql_query hamster-payment-db payment_db \
  "SELECT * FROM product_order_snapshots ORDER BY id DESC LIMIT 3;" || echo "  (no data or table error)"

echo ""
echo "  --- cash-gateway: payment_processes ---"
mysql_query hamster-cash-gateway-db cash_gateway_db \
  "SELECT * FROM payment_processes ORDER BY id DESC LIMIT 3;" || echo "  (no data or table error)"

echo ""
echo "  --- hamster-pg: payment_processes ---"
mysql_query hamster-pg-db hamster_pg_db \
  "SELECT * FROM payment_processes ORDER BY id DESC LIMIT 5;" || echo "  (no data or table error)"

PP_COUNT=$(mysql_query_raw hamster-pg-db hamster_pg_db "SELECT COUNT(*) FROM payment_processes;" | tr -d '[:space:]')

echo ""
echo "=========================================="
echo " RESULT: payment_processes = ${PP_COUNT} row(s)"
echo "=========================================="

if [ "$PP_COUNT" = "1" ]; then
  echo " SUCCESS - No duplicate PaymentProcess!"
elif [ "$PP_COUNT" = "0" ]; then
  echo " PENDING - Event chain may not have completed yet. Try --wait 30"
else
  echo " FAIL - Duplicate detected! (expected 1, got ${PP_COUNT})"
fi

echo ""
echo "=========================================="
echo " E2E Test Complete"
echo "=========================================="
