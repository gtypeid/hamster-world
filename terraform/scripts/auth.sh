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

# Realm JSON 파일 생성 (Terraform file()로 주입)
mkdir -p /home/ec2-user/keycloak-import
cat << 'REALMEOF' > /home/ec2-user/keycloak-import/hamster-world-realm.json
${REALM_JSON}
REALMEOF

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.
# (Terraform depends_on은 EC2 running 상태만 보장 → DB CREATE 완료 전 서비스 기동될 수 있음.
#  DB 미준비로 인한 crash 시 자동 복구)

# Keycloak 실행 (--import-realm으로 realm 자동 import)
docker run -d --name keycloak --restart unless-stopped -p 8090:8080 \
  -v /home/ec2-user/keycloak-import:/opt/keycloak/data/import \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD} \
  -e KC_DB=mysql \
  -e KC_DB_URL=jdbc:mysql://${DB_PRIVATE_IP}:3306/keycloak_db \
  -e KC_DB_USERNAME=root \
  -e "KC_DB_PASSWORD=$ROOT_PW" \
  -e KC_HOSTNAME_STRICT=false \
  -e KC_HOSTNAME_STRICT_HTTPS=false \
  -e KC_HTTP_ENABLED=true \
  -e KC_PROXY=edge \
  -e KC_HTTP_RELATIVE_PATH=/keycloak \
  quay.io/keycloak/keycloak:23.0 start-dev --import-realm
