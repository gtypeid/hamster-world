resource "aws_instance" "kafka" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.internal_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/scripts/deploy-template.sh", {
    instance_name   = "hamster-kafka"
    gh_deploy_token = var.github_token
    deploy_id       = var.deploy_id
    gh_repo         = var.github_repo
    report_script   = file("${path.module}/scripts/report-status.sh")
    deploy_script   = file("${path.module}/scripts/kafka.sh")
  })

  tags = {
    Name = "hamster-kafka"
  }
}