resource "aws_instance" "db" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.my_key.key_name
  vpc_security_group_ids = [aws_security_group.internal_sg.id]

  root_block_device {
    volume_size           = 30 
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("scripts/db.sh", {
    DB_ROOT_PASSWORD = var.db_root_password
    MONGO_PASSWORD   = var.mongo_password
  })

  tags = {
    Name = "hamster-db"
  }
}