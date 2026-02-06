# Scripts

프로젝트 관리 및 디버깅을 위한 유틸리티 스크립트 모음

## Kafka 관리 스크립트

### 1. `kafka-reset.sh` - Kafka 완전 초기화

Kafka 컨테이너를 삭제하고 데이터 볼륨까지 모두 지운 후 재시작합니다.

```bash
./scripts/kafka-reset.sh
```

**기능:**
- Kafka 컨테이너 중지 및 삭제
- Kafka 데이터 볼륨 삭제 (`.local/kafka/*`)
- 모든 토픽 및 메시지 삭제
- Kafka 재시작
- 상태 확인

**사용 시나리오:**
- 테스트 환경 초기화
- 토픽 구조 변경 후 클린 스타트
- 메시지가 너무 쌓여서 정리가 필요할 때

---

### 2. `kafka-topics.sh` - 토픽 목록 및 상세 정보

```bash
./scripts/kafka-topics.sh
```

**출력 정보:**
- 모든 토픽 목록
- 각 토픽의 Partition 수, Replication Factor
- Consumer Group 목록

**예시 출력:**
```
==================================================
Kafka 토픽 목록
==================================================
__consumer_offsets
ecommerce-events
payment-events
cash-gateway-events

==================================================
토픽 상세 정보
==================================================

--- ecommerce-events ---
Topic: ecommerce-events	TopicId: xxx	PartitionCount: 1	ReplicationFactor: 1
```

---

### 3. `kafka-messages.sh` - 토픽 메시지 조회

특정 토픽의 메시지를 처음부터 읽어옵니다.

```bash
# 기본: ecommerce-events 토픽의 최근 10개 메시지
./scripts/kafka-messages.sh

# 특정 토픽의 최근 5개 메시지
./scripts/kafka-messages.sh payment-events 5

# ecommerce-events 토픽의 최근 20개 메시지
./scripts/kafka-messages.sh ecommerce-events 20
```

**출력 정보:**
- Timestamp
- Key
- Value (JSON)

**예시 출력:**
```
CreateTime:1704067200000	null	{"eventType":"ProductCreatedEvent","productPublicId":"ABC123",...}
CreateTime:1704067201000	null	{"eventType":"OrderCreatedEvent","orderPublicId":"XYZ789",...}
```

---

### 4. `kafka-consumer-groups.sh` - Consumer Group 정보

```bash
# 모든 Consumer Group 목록
./scripts/kafka-consumer-groups.sh

# 특정 Consumer Group 상세 정보
./scripts/kafka-consumer-groups.sh payment-service-group
```

**출력 정보 (상세 조회 시):**
- Topic
- Partition
- Current Offset (현재까지 읽은 위치)
- Log End Offset (토픽의 마지막 메시지 위치)
- Lag (아직 읽지 않은 메시지 수)
- Consumer ID
- Host

**예시 출력:**
```
GROUP                   TOPIC              PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
payment-service-group   ecommerce-events   0          28              28              0
```

**Lag 해석:**
- `Lag = 0`: 모든 메시지를 소비함
- `Lag > 0`: 아직 처리하지 못한 메시지가 있음 (Consumer 지연)

---

## 사용 예시 시나리오

### 시나리오 1: 이벤트 발행 테스트

```bash
# 1. Kafka 초기화
./scripts/kafka-reset.sh

# 2. Ecommerce Service 실행
./gradlew :ecommerce-service:bootRun

# 3. Product 생성 API 호출
curl -X POST http://localhost:8080/api/merchant/products ...

# 4. 토픽에 메시지가 들어왔는지 확인
./scripts/kafka-messages.sh ecommerce-events 10

# 5. 토픽 정보 확인
./scripts/kafka-topics.sh
```

### 시나리오 2: Consumer 동작 확인

```bash
# 1. Payment Service 실행 전 메시지 발행
# (Ecommerce Service에서 Product 생성)

# 2. Consumer Group 확인 (아직 없음)
./scripts/kafka-consumer-groups.sh

# 3. Payment Service 실행
./gradlew :payment-service:bootRun

# 4. Consumer Group 상세 확인
./scripts/kafka-consumer-groups.sh payment-service-group

# 5. Lag이 0인지 확인 (모든 메시지 소비 완료)
```

### 시나리오 3: 메시지 히스토리 확인

```bash
# 과거 발행된 모든 이벤트 확인
./scripts/kafka-messages.sh ecommerce-events 100

# 특정 이벤트 타입 필터링 (jq 사용)
./scripts/kafka-messages.sh ecommerce-events 100 | grep "ProductCreatedEvent"
```

---

## 디버깅 팁

### 1. Consumer가 메시지를 안 읽어요!

```bash
# Consumer Group 확인
./scripts/kafka-consumer-groups.sh payment-service-group

# Lag 확인
# - Lag > 0: Consumer가 느림 (로그 확인 필요)
# - Consumer ID 없음: Consumer가 실행되지 않음
```

### 2. 메시지가 발행 안 돼요!

```bash
# 토픽에 메시지가 있는지 확인
./scripts/kafka-messages.sh ecommerce-events 10

# 메시지 개수가 0이면:
# - Producer 로그 확인
# - Kafka 연결 확인
```

### 3. 토픽이 자동 생성 안 돼요!

```bash
# 토픽 목록 확인
./scripts/kafka-topics.sh

# 없으면 수동 생성
docker exec hamster-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create \
  --topic ecommerce-events \
  --partitions 1 \
  --replication-factor 1
```

---

## 추가 유틸리티

### Kafka UI 접속
```
http://localhost:8989
```

GUI로 토픽, 메시지, Consumer Group을 확인할 수 있습니다.

### Kafka 로그 확인
```bash
docker logs -f hamster-kafka
```

### Kafka 컨테이너 접속
```bash
docker exec -it hamster-kafka bash
```
