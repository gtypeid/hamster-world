# ============================================================================
# cloud-init 완료 체크 (병렬)
# ============================================================================
#
# 각 인스턴스의 user_data(cloud-init) 실행 결과를 SSH로 확인한다.
# 인스턴스 리소스와 분리하여 null_resource로 선언한 이유:
#   - 인스턴스에 provisioner를 직접 붙이면, cloud-init이 끝나야 "생성 완료"로 처리된다.
#     terraform 의존성 그래프에 의해 db → auth → commerce 순서로 cloud-init까지
#     순차 대기하게 되어 전체 시간이 ~10분으로 늘어난다.
#   - null_resource는 인스턴스 간 의존성이 없으므로 8개가 동시에 cloud-init을 체크한다.
#     인스턴스 생성은 terraform 의존성 그래프대로 순차 진행(IP 참조 때문)되지만,
#     EC2 API 응답(~10초)만 기다리고 바로 다음으로 넘어간다.
#
# 동작:
#   cloud-init status --wait → 완료 대기 (블로킹)
#     exit 0 → 성공 (status: done)
#     exit 1 → 실패 (status: error) → null_resource 실패 → terraform apply 실패
#   하나라도 실패하면 apply 실패 → always() destroy로 전체 정리.
#
# 애플리케이션 의존성(db 없으면 commerce 못 뜸 등)은 여기서 강제하지 않는다.
# docker restart policy와 Kafka consumer lag으로 자체 수렴한다.
# ============================================================================

resource "null_resource" "cloud_init_db" {
  depends_on = [aws_instance.db]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.db.public_ip
    }
  }
}

resource "null_resource" "cloud_init_kafka" {
  depends_on = [aws_instance.kafka]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.kafka.public_ip
    }
  }
}

resource "null_resource" "cloud_init_auth" {
  depends_on = [aws_instance.auth]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.auth.public_ip
    }
  }
}

resource "null_resource" "cloud_init_commerce" {
  depends_on = [aws_instance.commerce]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.commerce.public_ip
    }
  }
}

resource "null_resource" "cloud_init_billing" {
  depends_on = [aws_instance.billing]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.billing.public_ip
    }
  }
}

resource "null_resource" "cloud_init_payment" {
  depends_on = [aws_instance.payment]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.payment.public_ip
    }
  }
}

resource "null_resource" "cloud_init_support" {
  depends_on = [aws_instance.support]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.support.public_ip
    }
  }
}

resource "null_resource" "cloud_init_front" {
  depends_on = [aws_instance.front]

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait"]
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = var.ssh_private_key_path != "" ? file(var.ssh_private_key_path) : ""
      host        = aws_instance.front.public_ip
    }
  }
}
