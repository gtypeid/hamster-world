#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

dd if=/dev/zero of=/swapfile bs=128M count=16
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

ROOT_PW='${DB_ROOT_PASSWORD}'
MONGO_PW='${MONGO_PASSWORD}'

# SUPPORT_PRIVATE_IP는 자기 자신의 IP (notification topology용)
# AWS 메타데이터에서 자신의 private IP 조회
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
SELF_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.
# (Terraform depends_on은 EC2 running 상태만 보장 → DB CREATE 완료 전 서비스 기동될 수 있음.
#  DB 미준비로 인한 crash, Kafka 컨슈머 장애 등 발생 시 자동 복구)

# progression 서비스 (포트 8084) - 포인트/등급 관리
docker run -d --name progression --restart unless-stopped -p 8084:8084 \
  -e JAVA_OPTS="-Xmx150m -Xms150m" \
  -e SPRING_PROFILES_ACTIVE=aws \
  -e DB_HOST=${DB_PRIVATE_IP} \
  -e "DB_PASSWORD=$ROOT_PW" \
  -e KAFKA_HOST=${KAFKA_PRIVATE_IP} \
  ghcr.io/gtypeid/hamster-progression:latest

# notification 서비스 (포트 8085) - DLQ 처리, MongoDB 사용
docker run -d --name notification --restart unless-stopped -p 8085:8085 \
  -e JAVA_OPTS="-Xmx150m -Xms150m" \
  -e SPRING_PROFILES_ACTIVE=aws \
  -e DB_HOST=${DB_PRIVATE_IP} \
  -e "DB_PASSWORD=$ROOT_PW" \
  -e "MONGO_PASSWORD=$MONGO_PW" \
  -e KAFKA_HOST=${KAFKA_PRIVATE_IP} \
  -e ECOMMERCE_HOST=${COMMERCE_PRIVATE_IP} \
  -e PAYMENT_HOST=${PAYMENT_PRIVATE_IP} \
  -e BILLING_HOST=${BILLING_PRIVATE_IP} \
  -e SUPPORT_HOST=$SELF_IP \
  ghcr.io/gtypeid/hamster-notification:latest

