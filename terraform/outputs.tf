# ============================================================================
# Infrastructure Report Outputs
# terraform plan 결과 자체가 인프라 레포트가 되도록 설계
# ============================================================================

# ── Entrypoint ──

output "entrypoint" {
  description = "사용자 진입점"
  value = {
    front_url    = "http://${aws_instance.front.public_ip}"
    keycloak_url = "http://${aws_instance.front.public_ip}/keycloak"
    public_ip    = aws_instance.front.public_ip
  }
}

# ── Instance Topology ──

output "instances" {
  description = "EC2 인스턴스 토폴로지 (8x t3.micro, ap-northeast-2)"
  value = {
    hamster-front = {
      role       = "Reverse Proxy & Static Hosting"
      sg         = "front-sg"
      services   = ["Nginx (reverse proxy)", "React Apps x4"]
      ports      = ["80"]
      ip         = aws_instance.front.public_ip
      exposure   = "Public"
    }
    hamster-auth = {
      role       = "Authentication & Authorization"
      sg         = "auth-sg"
      services   = ["Keycloak 23.0"]
      ports      = ["8090"]
      ip         = aws_instance.auth.private_ip
      exposure   = "VPC only (proxied via Nginx)"
      realm      = "hamster-world"
      roles      = ["MERCHANT", "USER", "DEVELOPER", "VENDOR", "SYSTEM"]
    }
    hamster-db = {
      role       = "Data Layer"
      sg         = "internal-sg"
      services   = ["MySQL 8.0", "MongoDB 7.0"]
      ports      = ["3306", "27017"]
      ip         = aws_instance.db.private_ip
      exposure   = "VPC only"
      databases  = [
        "ecommerce_db", "delivery_db", "cash_gateway_db", "payment_db",
        "progression_db", "notification_db", "hamster_pg_db", "keycloak_db"
      ]
    }
    hamster-kafka = {
      role       = "Event Broker"
      sg         = "internal-sg"
      services   = ["Kafka 7.5 (KRaft, no Zookeeper)"]
      ports      = ["9092", "9093"]
      ip         = aws_instance.kafka.private_ip
      exposure   = "VPC only"
      config     = "1 broker, KRaft mode, 256MB heap"
    }
    hamster-commerce = {
      role       = "eCommerce Domain"
      sg         = "internal-sg"
      services   = ["eCommerce API (Spring Boot)"]
      ports      = ["8080"]
      ip         = aws_instance.commerce.private_ip
      exposure   = "VPC only (proxied via Nginx)"
      endpoints  = ["/api/ecommerce/*"]
    }
    hamster-billing = {
      role       = "Payment Gateway"
      sg         = "internal-sg"
      services   = ["Cash Gateway (Spring Boot)", "Hamster PG Simulator"]
      ports      = ["8082", "8086"]
      ip         = aws_instance.billing.private_ip
      exposure   = "VPC only (proxied via Nginx)"
      endpoints  = ["/api/cash-gateway/*", "/api/hamster-pg/*"]
    }
    hamster-payment = {
      role       = "Payment Processing"
      sg         = "internal-sg"
      services   = ["Payment Service (Spring Boot)"]
      ports      = ["8083"]
      ip         = aws_instance.payment.private_ip
      exposure   = "VPC only (proxied via Nginx)"
      endpoints  = ["/api/payment/*"]
    }
    hamster-support = {
      role       = "Support Services"
      sg         = "internal-sg"
      services   = ["Progression Service", "Notification Service"]
      ports      = ["8084", "8085"]
      ip         = aws_instance.support.private_ip
      exposure   = "VPC only (proxied via Nginx)"
      endpoints  = ["/api/progression/*", "/api/notification/*"]
    }
  }
}

# ── Network & Security ──

output "security_groups" {
  description = "보안 그룹 정책 (3-tier network isolation)"
  value = {
    "front-sg" = {
      scope   = "Public"
      purpose = "사용자 트래픽 수신 (Nginx reverse proxy)"
      inbound = [
        "0.0.0.0/0 → :80  (HTTP)",
        "0.0.0.0/0 → :22  (SSH)",
      ]
      instances = ["hamster-front"]
    }
    "auth-sg" = {
      scope   = "VPC + SSH"
      purpose = "인증 서버 (Keycloak) - VPC 내부에서만 접근, 브라우저는 Nginx 프록시 경유"
      inbound = [
        "172.31.0.0/16 → :8090  (Keycloak)",
        "0.0.0.0/0     → :22    (SSH)",
      ]
      instances = ["hamster-auth"]
    }
    "internal-sg" = {
      scope   = "VPC only + SSH"
      purpose = "내부 서비스 간 통신 - DB, Kafka, Backend API"
      inbound = [
        "172.31.0.0/16 → :3306       (MySQL)",
        "172.31.0.0/16 → :27017      (MongoDB)",
        "172.31.0.0/16 → :9092-9093  (Kafka)",
        "172.31.0.0/16 → :8080-8086  (Backend APIs)",
        "0.0.0.0/0     → :22         (SSH)",
      ]
      instances = ["hamster-db", "hamster-kafka", "hamster-commerce", "hamster-billing", "hamster-payment", "hamster-support"]
    }
  }
}

# ── API Routing ──

output "api_routes" {
  description = "Nginx 리버스 프록시 라우팅 테이블"
  value = {
    "/api/ecommerce/*"    = "hamster-commerce:8080"
    "/api/cash-gateway/*" = "hamster-billing:8082"
    "/api/hamster-pg/*"   = "hamster-billing:8086"
    "/api/payment/*"      = "hamster-payment:8083"
    "/api/progression/*"  = "hamster-support:8084"
    "/api/notification/*" = "hamster-support:8085"
    "/keycloak/*"         = "hamster-auth:8090"
  }
}

# ── Infrastructure Spec ──

output "infrastructure_spec" {
  description = "인프라 사양 요약"
  value = {
    region         = "ap-northeast-2 (Seoul)"
    instance_type  = "t3.micro (2 vCPU, 1GB RAM)"
    instance_count = 8
    storage        = "30GB gp3 per instance"
    total_storage  = "240GB"
    vpc_cidr       = "172.31.0.0/16"
    databases      = "MySQL 8.0 (8 schemas) + MongoDB 7.0"
    event_broker   = "Kafka 7.5 KRaft (no Zookeeper)"
    auth           = "Keycloak 23.0 (5 realm roles)"
    frontends      = "4 React SPAs (ecommerce, content-creator, hamster-pg, internal-admin)"
    backend_stack  = "Spring Boot (Kotlin) + JPA + Kafka"
    session_policy = "terraform apply → sleep → terraform destroy (ephemeral)"
  }
}
