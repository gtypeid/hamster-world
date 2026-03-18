#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

dd if=/dev/zero of=/swapfile bs=128M count=16
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile


# 초기에 이렇게 받아왔으나 문제 생김
# -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092, EXTERNAL://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):9093 \
# (advertised.listeners = PLAINTEXT://localhost:9092,EXTERNAL://:9093) 비어있음

# 컨테이너 밖에서 미리 IP 획득 (다만 토큰 필요함)
# PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" -s)
PRIVATE_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

# --restart unless-stopped: docker run 옵션. 컨테이너 비정상 종료 시 Docker가 자동 재시작.

# Kafka KRaft (Zookeeper 없이)
docker run -d --name kafka --restart unless-stopped -p 9092:9092 -p 9093:9093 \
  -e KAFKA_NODE_ID=1 \
  -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9094 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9094,EXTERNAL://0.0.0.0:9093 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092,EXTERNAL://${PRIVATE_IP}:9093 \
  -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT \
  -e KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
  -e KAFKA_LOG_DIRS=/var/lib/kafka/data \
  -e CLUSTER_ID=MkU3OEVBNTcwNTJENDM2Qk \
  -e KAFKA_HEAP_OPTS="-Xmx256m -Xms256m" \
  confluentinc/cp-kafka:7.5.0

# AWS EC2 메타데이터 서비스
# http://169.254.169.254/latest/meta-data/local-ipv4

# 자기 private IP
# curl http://169.254.169.254/latest/meta-data/local-ipv4
# → 172.31.44.222

# 자기 public IP
# curl http://169.254.169.254/latest/meta-data/public-ipv4
# → 3.35.xxx.xxx

# 인스턴스 타입
# curl http://169.254.169.254/latest/meta-data/instance-type
# → t3.micro

#169.254.169.254는 AWS가 모든 EC2 내부에서만 접근 가능하게 만든 특수 IP입니다. 
# 외부에서는 접근 불가하고, 인스턴스 안에서만 됩니다.

# kafka.sh에서 이걸 쓰는 이유는 Kafka의 ADVERTISED_LISTENERS에 자기 private IP를 동적으로 넣어야 하기 때문
# 인스턴스 IP는 매번 바뀌니까 하드코딩할 수 없고, 부팅 시점에 이 API로 알아냄