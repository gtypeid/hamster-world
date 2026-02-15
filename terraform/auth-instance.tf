# Keycloak 인증 서버 (독립 인스턴스)
# 순환 참조 방지를 위해 front 인스턴스에서 분리
# auth는 db만 의존 → 단방향 의존성

resource "aws_instance" "auth" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.auth_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("scripts/auth.sh", {
    DB_PRIVATE_IP           = aws_instance.db.private_ip
    DB_ROOT_PASSWORD        = var.db_root_password
    KEYCLOAK_ADMIN_PASSWORD = var.keycloak_admin_password
    REALM_JSON              = file("keycloak/hamster-world-realm.json")
  })

  tags = {
    Name = "hamster-auth"
  }
}
