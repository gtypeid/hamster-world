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

# INFRA_STATUS push: GET → merge(자기 인스턴스만) → PATCH, 3회 반복
_IVAR="https://api.github.com/repos/${gh_repo}/actions/variables/INFRA_STATUS"
_AUTH="Authorization: Bearer $${GH_DEPLOY_TOKEN}"
push_infra_status() {
  local s="$1" ip="$${2:-}"
  local d; [ -n "$ip" ] && d="{\"status\":\"$s\",\"ip\":\"$ip\"}" || d="{\"status\":\"$s\"}"
  for i in 1 2 3; do
    local c; c=$(curl -sf -H "$_AUTH" "$_IVAR" 2>/dev/null | jq -r '.value // "{}"' 2>/dev/null || echo '{}')
    local m; m=$(echo "$c" | jq --arg n "$INSTANCE_NAME" --argjson d "$d" '.instances[$n]=$d|.updatedAt=(now|todate)' 2>/dev/null || echo "$c")
    local e; e=$(echo "$m" | jq -Rs '.')
    curl -sf -X PATCH -H "$_AUTH" -H "Accept: application/vnd.github.v3+json" -d "{\"value\":$e}" "$_IVAR" >/dev/null 2>&1 || true
    [ $i -lt 3 ] && sleep 1
  done
}

PRIVATE_IP=$(curl -sf --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 || echo "unknown")

report_status "인스턴스 시작 (IP: $PRIVATE_IP)"
push_infra_status "provisioning" "$PRIVATE_IP"

cat << 'DEPLOY_EOF' > /tmp/deploy.sh
${deploy_script}
DEPLOY_EOF

report_status "배포 스크립트 실행 시작"
if bash /tmp/deploy.sh; then
  report_status "배포 스크립트 완료"
else
  report_status "배포 스크립트 실패 (exit code: $?)" "failure"
  push_infra_status "failed" "$PRIVATE_IP"
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
push_infra_status "running" "$PRIVATE_IP"
