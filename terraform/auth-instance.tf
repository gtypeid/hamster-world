# Keycloak 인증 서버 (독립 인스턴스)
# 순환 참조 방지를 위해 front 인스턴스에서 분리
# auth는 db만 의존 → 단방향 의존성

resource "aws_instance" "auth" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.auth_sg.id]

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/scripts/deploy-template.sh", {
    instance_name   = "hamster-auth"
    gh_deploy_token = var.github_token
    deploy_id       = var.deploy_id
    gh_repo         = var.github_repo
    report_script   = file("${path.module}/scripts/report-status.sh")
    deploy_script   = templatefile("${path.module}/scripts/auth.sh", {
      DB_PRIVATE_IP           = aws_instance.db.private_ip
      DB_ROOT_PASSWORD        = var.db_root_password
      KEYCLOAK_ADMIN_PASSWORD = var.keycloak_admin_password
      REALM_JSON              = file("${path.module}/keycloak/hamster-world-realm.json")
    })
  })

  # cloud-init(user_data) 완료 대기. 실패 시 terraform apply 중단 → always() destroy로 정리.
  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = self.public_ip
    }
  }

  tags = {
    Name = "hamster-auth"
  }
}
