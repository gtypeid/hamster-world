# ============================================================================
# Route 53 DNS — A 레코드 자동 등록
# ============================================================================
#
# 사전 준비 (1회, 수동):
#   1. AWS 콘솔 → Route 53 → 호스팅 영역 생성 (domain_name과 동일한 도메인)
#   2. 발급된 NS 4개를 도메인 등록 업체(가비아/후이즈)에서 네임서버로 변경
#
# Terraform이 하는 일:
#   - apply:  호스팅 영역 조회 → A 레코드 생성 (front Public IP)
#   - destroy: A 레코드 삭제 (호스팅 영역은 건드리지 않음)
#
# domain_name이 빈 문자열이면 DNS 리소스를 생성하지 않는다.
# Route 53 호스팅 영역이 없는 환경에서도 apply가 깨지지 않도록 하기 위함.
# ============================================================================

data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

resource "aws_route53_record" "front" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 60
  records = [aws_instance.front.public_ip]
}