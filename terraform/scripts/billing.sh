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

# 같은 인스턴스의 다른 Docker 컨테이너와 통신하려면 호스트 private IP 필요
# (Docker bridge 네트워크에서 localhost는 컨테이너 자기 자신)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
SELF_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.
# (Terraform depends_on은 EC2 running 상태만 보장 → DB CREATE 완료 전 서비스 기동될 수 있음.
#  DB 미준비로 인한 crash, Kafka 컨슈머 장애 등 발생 시 자동 복구)

# cash-gateway 서비스 (포트 8082)
docker run -d --name cash-gateway --restart unless-stopped -p 8082:8082 \
  -e JAVA_OPTS="-Xmx300m -Xms300m" \
  -e SPRING_PROFILES_ACTIVE=aws \
  -e DB_HOST=${DB_PRIVATE_IP} \
  -e "DB_PASSWORD=$ROOT_PW" \
  -e KAFKA_HOST=${KAFKA_PRIVATE_IP} \
  -e KEYCLOAK_HOST=${AUTH_PRIVATE_IP} \
  -e PG_HOST=$SELF_IP \
  ghcr.io/gtypeid/hamster-cash-gateway:latest


# hamster-pg 서비스 (포트 8086) - 외부 PG 시뮬레이터
docker run -d --name hamster-pg --restart unless-stopped -p 8086:8086 \
  -e JAVA_OPTS="-Xmx150m -Xms150m" \
  -e SPRING_PROFILES_ACTIVE=aws \
  -e DB_HOST=${DB_PRIVATE_IP} \
  -e "DB_PASSWORD=$ROOT_PW" \
  -e KAFKA_HOST=${KAFKA_PRIVATE_IP} \
  -e CASH_GATEWAY_HOST=$SELF_IP \
  ghcr.io/gtypeid/hamster-pg:latest
