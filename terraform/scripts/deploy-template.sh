#!/bin/bash
set -euo pipefail

export INSTANCE_NAME="${instance_name}"
export GH_DEPLOY_TOKEN="${gh_deploy_token}"
export DEPLOY_ID="${deploy_id}"
export GH_REPO="${gh_repo}"

cat << 'REPORT_EOF' > /tmp/report-status.sh
${report_script}
REPORT_EOF
source /tmp/report-status.sh

# jq: push_infra_status에서 JSON merge에 필요. AL2023 기본 이미지에 미포함.
yum install -y jq

# INFRA_STATUS push: GET → merge(자기 인스턴스만) → PATCH × 3회 (레이스컨디션 수렴). 실패 시 스크립트 중단.
_IVAR="https://api.github.com/repos/$${GH_REPO}/actions/variables/INFRA_STATUS"
_AUTH="Authorization: Bearer $${GH_DEPLOY_TOKEN}"
push_infra_status() {
  [ -z "$${GH_DEPLOY_TOKEN}" ] && return 0
  local s="$1" ip="$${2:-}" pub="$${3:-}"
  local d="{\"status\":\"$s\"}"
  [ -n "$ip" ]  && d=$(echo "$d" | jq --arg v "$ip"  '.ip=$v')
  [ -n "$pub" ] && d=$(echo "$d" | jq --arg v "$pub" '.publicIp=$v')
  for i in 1 2 3; do
    local c; c=$(curl -sf -H "$_AUTH" "$_IVAR" | jq -r '.value // "{}"')
    local m; m=$(echo "$c" | jq --arg n "$INSTANCE_NAME" --argjson d "$d" '.instances[$n]=$d|.updatedAt=(now|todate)')
    local e; e=$(echo "$m" | jq -Rs '.')
    curl -sf -X PATCH -H "$_AUTH" -H "Accept: application/vnd.github.v3+json" -d "{\"value\":$e}" "$_IVAR"
    # 원래 코드: [ $i -lt 3 ] && sleep 1
    # 문제: i=3일 때 [ 3 -lt 3 ]이 false(exit 1)를 반환하고, && 체인의 전체 exit code가 1이 된다.
    #       이 1이 for 루프 → 함수 반환값으로 전파되어, 호출 지점에서 set -e가 스크립트를 종료시킨다.
    #       (&&/|| 내부의 개별 명령은 set -e에서 보호되지만, 전체 표현식의 exit code는 보호되지 않는다)
    # 수정: if 문은 조건이 false여도 전체 문장의 exit code가 0이므로 set -e를 발동시키지 않는다.
    if [ $i -lt 3 ]; then sleep 1; fi
  done
}

# IMDSv2: 토큰 발급 → 메타데이터 조회 (Amazon Linux 2023 기본값이 IMDSv2 required)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PRIVATE_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || echo "")

report_status "인스턴스 시작 (Private: $PRIVATE_IP, Public: $PUBLIC_IP)"
push_infra_status "provisioning" "$PRIVATE_IP" "$PUBLIC_IP"

cat << 'DEPLOY_EOF' > /tmp/deploy.sh
${deploy_script}
DEPLOY_EOF

report_status "배포 스크립트 실행 시작"
if bash /tmp/deploy.sh; then
  report_status "배포 스크립트 완료"
else
  report_status "배포 스크립트 실패 (exit code: $?)" "failure"
  push_infra_status "failed" "$PRIVATE_IP" "$PUBLIC_IP"
  exit 1
fi

sleep 5
if command -v docker &> /dev/null; then
  for ctn in $(docker ps --format '{{.Names}}' 2>/dev/null); do
    status=$(docker inspect --format='{{.State.Status}}' "$ctn" 2>/dev/null || echo "unknown")
    ports=$(docker port "$ctn" 2>/dev/null | tr '\n' ' ' || echo "no ports")
    report_status "$ctn: $status ($ports)"
  done
fi

report_status "가동 완료" "success"
push_infra_status "running" "$PRIVATE_IP" "$PUBLIC_IP"
