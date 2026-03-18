#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

dd if=/dev/zero of=/swapfile bs=128M count=16
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

mkdir -p /home/ec2-user/html

# 각 프론트 이미지에서 빌드 결과물 추출 (AWS 빌드 - :aws 태그)
# $${app}으로 이스케이프 - 테라폼이 해석하지 않음
for app in ecommerce content-creator hamster-pg internal-admin; do
  docker pull ghcr.io/gtypeid/hamster-front-$${app}:aws
  docker create --name tmp-$${app} ghcr.io/gtypeid/hamster-front-$${app}:aws
  docker cp tmp-$${app}:/usr/share/nginx/html /home/ec2-user/html/$${app}
  docker rm tmp-$${app}
done

# Nginx 설정 - 프론트 정적 파일 + API 리버스 프록시 + Keycloak 프록시
# 정적 파일 부분 (Terraform 변수 불필요 → 'NGINX' heredoc)
cat > /home/ec2-user/nginx.conf <<'NGINX'
server {
    listen 80;

    # ===== 프론트엔드 정적 파일 =====

    location /ecommerce {
        alias /usr/share/nginx/html/ecommerce;
        try_files $uri $uri/ /ecommerce/index.html;
    }

    location /content-creator {
        alias /usr/share/nginx/html/content-creator;
        try_files $uri $uri/ /content-creator/index.html;
    }

    location /hamster-pg {
        alias /usr/share/nginx/html/hamster-pg;
        try_files $uri $uri/ /hamster-pg/index.html;
    }

    location /internal-admin {
        alias /usr/share/nginx/html/internal-admin;
        try_files $uri $uri/ /internal-admin/index.html;
    }
NGINX

# API 리버스 프록시 부분 (Terraform 변수 사용 → EOF heredoc)
cat >> /home/ec2-user/nginx.conf <<EOF

    # ===== API 리버스 프록시 (백엔드 서비스) =====
    # Nginx가 /api/ 접두사를 붙여줌 → 프론트엔드는 /api/ 없이 호출
    # 예: 프론트 /api/ecommerce/carts → Nginx → backend:8080/api/carts
    # 이렇게 하면 브라우저 URL에 /api/ 중복이 없어짐

    # ecommerce-service (commerce 인스턴스:8080)
    location /api/ecommerce/ {
        proxy_pass http://${COMMERCE_PRIVATE_IP}:8080/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # cash-gateway-service (billing 인스턴스:8082)
    location /api/cash-gateway/ {
        proxy_pass http://${BILLING_PRIVATE_IP}:8082/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # hamster-pg-service (billing 인스턴스:8086)
    location /api/hamster-pg/ {
        proxy_pass http://${BILLING_PRIVATE_IP}:8086/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # payment-service (payment 인스턴스:8083)
    location /api/payment/ {
        proxy_pass http://${PAYMENT_PRIVATE_IP}:8083/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # progression-service (support 인스턴스:8084)
    location /api/progression/ {
        proxy_pass http://${SUPPORT_PRIVATE_IP}:8084/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # notification-service (support 인스턴스:8085)
    location /api/notification/ {
        proxy_pass http://${SUPPORT_PRIVATE_IP}:8085/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ===== Keycloak 리버스 프록시 (auth 인스턴스) =====
    # KC_HTTP_RELATIVE_PATH=/keycloak 설정으로 Keycloak이 /keycloak/ 하위에서 서빙
    # → 이 하나의 location으로 리소스, 로그인, 토큰 엔드포인트 전부 커버
    location /keycloak/ {
        proxy_pass http://${AUTH_PRIVATE_IP}:8090/keycloak/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.

# Nginx 실행 (host 네트워크)
docker run -d --name nginx --restart unless-stopped --network host \
  -v /home/ec2-user/html:/usr/share/nginx/html \
  -v /home/ec2-user/nginx.conf:/etc/nginx/conf.d/default.conf \
  nginx
