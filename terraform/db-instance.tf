resource "aws_instance" "db" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.internal_sg.id]

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/scripts/deploy-template.sh", {
    instance_name   = "hamster-db"
    gh_deploy_token = var.github_token
    deploy_id       = var.deploy_id
    gh_repo         = var.github_repo
    report_script   = file("${path.module}/scripts/report-status.sh")
    deploy_script   = templatefile("${path.module}/scripts/db.sh", {
      DB_ROOT_PASSWORD = var.db_root_password
      MONGO_PASSWORD   = var.mongo_password
    })
  })

  # cloud-init(user_data) 완료 대기. 실패 시 terraform apply 중단 → always() destroy로 정리.
  # user_data는 비동기 실행이라 terraform이 결과를 모르므로, SSH로 직접 확인한다.
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
    Name = "hamster-db"
  }
}