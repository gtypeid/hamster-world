#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

dd if=/dev/zero of=/swapfile bs=128M count=16
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 특수문자(! 등) 포함 비밀번호를 single quote로 변수에 담아 bash 해석 방지
# (Terraform templatefile이 먼저 치환 → EC2에서는 리터럴 값이 들어감)
ROOT_PW='${DB_ROOT_PASSWORD}'
MONGO_PW='${MONGO_PASSWORD}'

# MySQL 통합 (DB 7개)
echo "[DEBUG] ROOT_PW 길이: $(echo -n "$ROOT_PW" | wc -c)"
echo "[DEBUG] docker run 명령 실행..."
docker run -d --name mysql -p 3306:3306 \
  -e "MYSQL_ROOT_PASSWORD=$ROOT_PW" \
  --restart unless-stopped \
  mysql:8.0 \
  --innodb-buffer-pool-size=64M \
  --max-connections=100 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
echo "[DEBUG] docker run 종료코드: $?"

# MySQL 준비 대기 (단순 ping이 아니라 실제 접속 가능 여부 반복 확인)
#
# MySQL Docker 이미지는 최초 실행 시 "이중 기동" 과정을 거침:
#   1) /var/lib/mysql 비어있으면 임시 서버(Temporary Server) 기동
#   2) 임시 서버에서 시스템 테이블 초기화 + root 비밀번호 설정
#   3) 임시 서버 종료
#   4) 진짜 서버(Production Server) 기동
#
# mysqladmin ping은 2단계(임시 서버)에서도 응답함 → "떴다!" 판단 후
# CREATE DATABASE를 날리면 3단계(종료 후 재시작) 타이밍에 걸려 Access denied 발생.
# 보통 MySQL 8.0은 완전히 준비되는 데 15~20초 소요.
#
# → 실제 인증 + 쿼리(SELECT 1)가 성공해야 진짜 ready 상태.
echo "MySQL 기동 대기..."
for i in $(seq 1 30); do
  if docker exec mysql mysql -uroot -p"$ROOT_PW" -e "SELECT 1" >/dev/null 2>&1; then
    echo "MySQL 완전 기동 확인 ($${i}회차)"
    sleep 3
    break
  fi
  echo "  대기 중... ($${i})"
  sleep 2
done

# DB 8개 생성
echo "[DEBUG] CREATE DATABASE 실행..."
docker exec mysql mysql -uroot -p"$ROOT_PW" -e "
  CREATE DATABASE IF NOT EXISTS ecommerce_db;
  CREATE DATABASE IF NOT EXISTS delivery_db;
  CREATE DATABASE IF NOT EXISTS cash_gateway_db;
  CREATE DATABASE IF NOT EXISTS payment_db;
  CREATE DATABASE IF NOT EXISTS progression_db;
  CREATE DATABASE IF NOT EXISTS notification_db;
  CREATE DATABASE IF NOT EXISTS hamster_pg_db;
  CREATE DATABASE IF NOT EXISTS keycloak_db;
"
DB_CREATE_EXIT=$?
echo "[DEBUG] CREATE DATABASE 종료코드: $DB_CREATE_EXIT"

# DB 생성 검증
echo "[DEBUG] 생성된 DB 목록:"
docker exec mysql mysql -uroot -p"$ROOT_PW" -e "SHOW DATABASES;" 2>&1
echo "[DEBUG] DB 검증 종료코드: $?"

echo "DB 생성 완료"

# MongoDB
docker run -d --name mongodb --restart unless-stopped -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e "MONGO_INITDB_ROOT_PASSWORD=$MONGO_PW" \
  mongo:7.0