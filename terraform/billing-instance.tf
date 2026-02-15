resource "aws_instance" "billing" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.internal_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("scripts/billing.sh", {
    DB_PRIVATE_IP    = aws_instance.db.private_ip
    KAFKA_PRIVATE_IP = aws_instance.kafka.private_ip
    AUTH_PRIVATE_IP  = aws_instance.auth.private_ip
    DB_ROOT_PASSWORD = var.db_root_password
  })

  tags = {
    Name = "hamster-billing"
  }
}
