# Front 인스턴스 - Nginx (정적 파일 + 리버스 프록시)
# Keycloak 분리로 순환 참조 해소 → 백엔드 IP 직접 주입 가능

resource "aws_instance" "front" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.front_sg.id]

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/scripts/deploy-template.sh", {
    instance_name   = "hamster-front"
    gh_deploy_token = var.github_token
    deploy_id       = var.deploy_id
    gh_repo         = var.github_repo
    report_script   = file("${path.module}/scripts/report-status.sh")
    deploy_script   = templatefile("${path.module}/scripts/front.sh", {
      # API 리버스 프록시용 백엔드 인스턴스 IP
      COMMERCE_PRIVATE_IP = aws_instance.commerce.private_ip
      BILLING_PRIVATE_IP  = aws_instance.billing.private_ip
      PAYMENT_PRIVATE_IP  = aws_instance.payment.private_ip
      SUPPORT_PRIVATE_IP  = aws_instance.support.private_ip
      # Keycloak 프록시용
      AUTH_PRIVATE_IP     = aws_instance.auth.private_ip
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
    Name = "hamster-front"
  }
}
