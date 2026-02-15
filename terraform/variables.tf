variable "aws_access_key" {}
variable "aws_secret_key" {}

variable "db_root_password" {}
variable "keycloak_admin_password" {}
variable "mongo_password" {}

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