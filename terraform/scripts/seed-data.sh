#!/bin/bash
# ============================================================================
# 더미 데이터 생성 스크립트
# ============================================================================
# Terraform null_resource에서 로컬 실행
# 의존: Keycloak + Kafka + Ecommerce Service
#
# 흐름:
#   1. Keycloak에서 ve 계정 토큰 발급 (password grant)
#   2. 인증 API 호출 → JwtUserSyncFilter가 User 자동 생성
#   3. 머천트 등록 API 호출
#   4. 더미 상품 7개 생성 → Kafka 이벤트 → Payment Service 자동 동기화
#
# 사용법: ./seed-data.sh <FRONT_PUBLIC_IP>

set -e

FRONT_IP=$1
if [ -z "$FRONT_IP" ]; then
  echo "[seed] ERROR: FRONT_PUBLIC_IP 인자 필요"
  echo "Usage: $0 <FRONT_PUBLIC_IP>"
  exit 1
fi

BASE_URL="http://${FRONT_IP}"
KEYCLOAK_URL="${BASE_URL}/keycloak"
ECOMMERCE_URL="${BASE_URL}/api/ecommerce"
MAX_WAIT=300

echo "============================================"
echo "[seed] 더미 데이터 생성 시작"
echo "[seed] Front: ${BASE_URL}"
echo "============================================"

# ----------------------------------------------------------------------------
# 1. Ecommerce Service 헬스체크 대기
# ----------------------------------------------------------------------------
echo "[seed] ecommerce-service 기동 대기..."
elapsed=0
until curl -sf "${ECOMMERCE_URL}/public/products/list" > /dev/null 2>&1; do
  sleep 5
  elapsed=$((elapsed + 5))
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[seed] TIMEOUT: ecommerce-service 기동 실패 (${MAX_WAIT}초)"
    exit 1
  fi
  echo "[seed]   대기 중... (${elapsed}초)"
done
echo "[seed] ecommerce-service 기동 확인 (${elapsed}초)"

# ----------------------------------------------------------------------------
# 2. Keycloak 토큰 발급 (ve / 1234)
# ----------------------------------------------------------------------------
echo "[seed] Keycloak 토큰 발급 시도..."
TOKEN=""
elapsed=0
while [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; do
  RESPONSE=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/hamster-world/protocol/openid-connect/token" \
    -d "grant_type=password" \
    -d "client_id=ecommerce" \
    -d "username=ve" \
    -d "password=1234" 2>/dev/null || echo "")

  if [ -n "$RESPONSE" ]; then
    TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
  fi

  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
    sleep 5
    elapsed=$((elapsed + 5))
    if [ $elapsed -ge $MAX_WAIT ]; then
      echo "[seed] TIMEOUT: Keycloak 토큰 발급 실패 (${MAX_WAIT}초)"
      exit 1
    fi
    echo "[seed]   토큰 발급 대기 중... (${elapsed}초)"
  fi
done
echo "[seed] 토큰 발급 성공"

AUTH_HEADER="Authorization: Bearer ${TOKEN}"

# ----------------------------------------------------------------------------
# 3. 머천트 등록
# ----------------------------------------------------------------------------
# 첫 인증 API 호출 시 JwtUserSyncFilter가 User 자동 생성
# 머천트 등록 시 User Role → MERCHANT 자동 변경
echo "[seed] 머천트 등록..."
MERCHANT_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${ECOMMERCE_URL}/merchants" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "도토리 장수 함돌이",
    "businessNumber": "123-45-67890",
    "representativeName": "ve",
    "businessAddress": "햄스터빌 도토리길 1",
    "businessType": "반려동물 용품",
    "storeName": "도토리 장수 함돌이",
    "contactEmail": "ve@t",
    "contactPhone": "010-0000-0000",
    "storeDescription": "햄스터를 위한 프리미엄 용품 전문점",
    "bankName": "햄스터은행",
    "accountNumber": "1234567890",
    "accountHolder": "ve",
    "settlementCycle": "WEEKLY"
  }')
echo "[seed] 머천트 등록 -> HTTP ${MERCHANT_STATUS}"

# 머천트 등록 후 토큰 재발급 (MERCHANT 역할 반영)
echo "[seed] 토큰 재발급 (MERCHANT 역할 반영)..."
RESPONSE=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/hamster-world/protocol/openid-connect/token" \
  -d "grant_type=password" \
  -d "client_id=ecommerce" \
  -d "username=ve" \
  -d "password=1234" 2>/dev/null)
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
echo "[seed] 토큰 재발급 완료"

# ----------------------------------------------------------------------------
# 4. 더미 상품 생성
# ----------------------------------------------------------------------------
create_product() {
  local sku=$1 name=$2 category=$3 price=$4 stock=$5 desc=$6
  local status=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${ECOMMERCE_URL}/merchant/products" \
    -H "${AUTH_HEADER}" \
    -H "Content-Type: application/json" \
    -d "{\"sku\":\"${sku}\",\"name\":\"${name}\",\"category\":\"${category}\",\"price\":${price},\"initialStock\":${stock},\"description\":\"${desc}\"}")
  echo "[seed]   ${name} (${sku}) -> HTTP ${status}"
}

echo "[seed] 더미 상품 생성..."
create_product "FOOD-001"      "프리미엄 해바라기씨"   "FOOD"      2500  100 "고소하고 영양가 높은 해바라기씨"
create_product "FOOD-002"      "유기농 도토리"         "FOOD"      3500  80  "산에서 직접 채취한 유기농 도토리"
create_product "FOOD-003"      "건조 밀웜 간식"        "FOOD"      4000  50  "단백질 가득한 건조 밀웜"
create_product "FURNITURE-001" "아늑한 나무 하우스"    "FURNITURE" 15000 30  "천연 나무로 만든 햄스터 하우스"
create_product "SPORTS-001"    "무소음 쳇바퀴"         "SPORTS"    12000 40  "밤에도 조용한 프리미엄 쳇바퀴"
create_product "BEDDING-001"   "천연 목화 침구"        "BEDDING"   5000  60  "부드럽고 안전한 천연 목화 베딩"
create_product "TOYS-001"      "터널 놀이세트"         "TOYS"      8000  25  "연결형 터널 놀이세트"

echo "============================================"
echo "[seed] 더미 데이터 생성 완료"
echo "============================================"
