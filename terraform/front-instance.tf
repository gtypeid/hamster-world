# Front 인스턴스 - Nginx (정적 파일 + 리버스 프록시)
# Keycloak 분리로 순환 참조 해소 → 백엔드 IP 직접 주입 가능

resource "aws_instance" "front" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.front_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("scripts/front.sh", {
    # API 리버스 프록시용 백엔드 인스턴스 IP
    COMMERCE_PRIVATE_IP = aws_instance.commerce.private_ip
    BILLING_PRIVATE_IP  = aws_instance.billing.private_ip
    PAYMENT_PRIVATE_IP  = aws_instance.payment.private_ip
    SUPPORT_PRIVATE_IP  = aws_instance.support.private_ip
    # Keycloak 프록시용
    AUTH_PRIVATE_IP     = aws_instance.auth.private_ip
  })

  tags = {
    Name = "hamster-front"
  }
}
