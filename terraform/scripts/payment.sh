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

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.
# (Terraform depends_on은 EC2 running 상태만 보장 → DB CREATE 완료 전 서비스 기동될 수 있음.
#  DB 미준비로 인한 crash, Kafka 컨슈머 장애 등 발생 시 자동 복구)

# payment 서비스 (포트 8083)
docker run -d --name payment --restart unless-stopped -p 8083:8083 \
  -e JAVA_OPTS="-Xmx300m -Xms300m" \
  -e SPRING_PROFILES_ACTIVE=aws \
  -e DB_HOST=${DB_PRIVATE_IP} \
  -e "DB_PASSWORD=$ROOT_PW" \
  -e KAFKA_HOST=${KAFKA_PRIVATE_IP} \
  -e KEYCLOAK_HOST=${AUTH_PRIVATE_IP} \
  ghcr.io/gtypeid/hamster-payment:latest