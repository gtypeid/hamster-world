resource "aws_key_pair" "my_key" {
  key_name   = "hamster-key"
  public_key = file("~/.ssh/aws_server.pub")
}

# front_sg: 외부에서 사용자가 접근 → 0.0.0.0/0
resource "aws_security_group" "front_sg" {
  name = "front-sg"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    # 모든 ICMP 타입
    from_port   = -1
    # 모든 ICMP 코드
    to_port     = -1
    # ICMP 프로토콜만
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    # protocol = "-1"이 **"전부 허용"**의 핵심이고, 
    # 이때 from_port = 0, to_port = 0은 그냥 필수값이라 넣는 것뿐. 실질적 의미는 없다
    from_port   = 0
    to_port     = 0
    #  모든 프로토콜 (TCP, UDP, ICMP 전부)
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# auth_sg: Keycloak 인증 서버
# - 8090: Nginx 프록시(front)에서 접근 + 백엔드에서 JWT 검증용 접근 (VPC 내부)
# - 브라우저는 Nginx /keycloak/ 프록시를 통해 간접 접근
resource "aws_security_group" "auth_sg" {
  name = "auth-sg"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Keycloak (VPC 내부에서만 접근 - front 프록시 + 백엔드 JWT 검증)
  ingress {
    from_port   = 8090
    to_port     = 8090
    protocol    = "tcp"
    cidr_blocks = ["172.31.0.0/16"]
  }

  # ICMP
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# internal_sg: 내부 인스턴스끼리만 통신 → 172.31.0.0/16 (SSH만 0.0.0.0/0)
# internal_sg = "내부 인스턴스들끼리 이 포트들로 통신 가능"
# ├── 3306    → MySQL 쓰는 애들 접근 가능
# ├── 27017   → MongoDB 쓰는 애들 접근 가능
# └── 9092-93 → Kafka 쓰는 애들 접근 가능
resource "aws_security_group" "internal_sg" {
  name = "internal-sg"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # MySQL
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["172.31.0.0/16"]
  }

  # MongoDB
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["172.31.0.0/16"]
  }

  # Kafka
  ingress {
    from_port   = 9092
    to_port     = 9093
    protocol    = "tcp"
    cidr_blocks = ["172.31.0.0/16"]
  }

  # Backend API 서비스 (Nginx 리버스 프록시에서 접근)
  # 8080: ecommerce, 8082: cash-gateway, 8083: payment
  # 8084: progression, 8085: notification, 8086: hamster-pg
  ingress {
    from_port   = 8080
    to_port     = 8086
    protocol    = "tcp"
    cidr_blocks = ["172.31.0.0/16"]
  }

  # ICMP
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}