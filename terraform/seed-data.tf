# ============================================================================
# 더미 데이터 생성 (null_resource)
# ============================================================================
# 의존: Keycloak(auth) + Kafka + Ecommerce(commerce) + Front(Nginx 프록시)
#
# Terraform apply 완료 후 로컬에서 seed-data.sh 실행
# - Keycloak 토큰 발급 → 머천트 생성 → 상품 생성
# - Kafka 이벤트 발행 → Payment Service 자동 동기화

resource "null_resource" "seed_data" {
  depends_on = [
    aws_instance.front,
    aws_instance.auth,
    aws_instance.kafka,
    aws_instance.commerce,
  ]

  provisioner "local-exec" {
    command     = "bash scripts/seed-data.sh ${aws_instance.front.public_ip}"
    working_dir = path.module
  }
}
