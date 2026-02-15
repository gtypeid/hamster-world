# Front
output "front_public_ip" {
  value = aws_instance.front.public_ip
}

output "front_url" {
  value = "http://${aws_instance.front.public_ip}"
}

# Auth (Keycloak)
output "auth_private_ip" {
  value = aws_instance.auth.private_ip
}

output "keycloak_url" {
  value = "http://${aws_instance.front.public_ip}/keycloak"
}

# DB
output "db_private_ip" {
  value = aws_instance.db.private_ip
}

# Kafka
output "kafka_private_ip" {
  value = aws_instance.kafka.private_ip
}

# Commerce
output "commerce_private_ip" {
  value = aws_instance.commerce.private_ip
}

# Billing
output "billing_private_ip" {
  value = aws_instance.billing.private_ip
}

# Payment
output "payment_private_ip" {
  value = aws_instance.payment.private_ip
}

# Support
output "support_private_ip" {
  value = aws_instance.support.private_ip
}
