variable "aws_access_key" {}
variable "aws_secret_key" {}

variable "db_root_password" {}
variable "keycloak_admin_password" {}
variable "mongo_password" {}

# SSH 프라이빗 키 경로 (provisioner "remote-exec"에서 사용)
# cloud-init(user_data) 완료를 대기하고, 실패 시 terraform apply를 중단시킨다.
# GitHub Actions 러너에서 실행되므로 워크플로우에서 시크릿을 파일로 써서 경로를 전달한다.
variable "ssh_private_key_path" {
  default     = ""
  description = "Path to SSH private key for remote-exec provisioner"
}

# GitHub Deployments API (배포 상태 추적)
variable "github_token" {
  default     = ""
  description = "GitHub PAT for Deployments API (Fine-grained, Deployments write only)"
}
variable "deploy_id" {
  default     = ""
  description = "GitHub Deployment ID (workflow에서 생성 후 전달)"
}
variable "github_repo" {
  default     = ""
  description = "GitHub repository (owner/repo format)"
}