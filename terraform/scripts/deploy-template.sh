#!/bin/bash
# ============================================================================
# 템플릿 메소드 - 배포 골격
# ============================================================================
# 구조: 시작 보고 → 배포 스크립트 실행 → 상태 수집 → 완료 보고
#
# templatefile()로 주입되는 변수:
#   INSTANCE_NAME   - 인스턴스 이름 (e.g. "hamster-auth")
#   GH_DEPLOY_TOKEN - GitHub Deployments API 토큰
#   DEPLOY_ID       - GitHub Deployment ID
#   GH_REPO         - GitHub 리포 (e.g. "owner/hamster-world")
#   DEPLOY_SCRIPT   - 실제 배포 스크립트 내용 (file()로 주입)
#   REPORT_SCRIPT   - report-status.sh 내용 (file()로 주입)
# ============================================================================

set -euo pipefail

# ── 환경변수 설정 (templatefile에서 주입) ──
export INSTANCE_NAME="${instance_name}"
export GH_DEPLOY_TOKEN="${gh_deploy_token}"
export DEPLOY_ID="${deploy_id}"
export GH_REPO="${gh_repo}"

# ── 보고 함수 로드 ──
cat << 'REPORT_EOF' > /tmp/report-status.sh
${report_script}
REPORT_EOF
source /tmp/report-status.sh

# ── INFRA_STATUS push 함수 ──
# GitHub Repository Variable(INFRA_STATUS)에 인스턴스 상태를 실시간 반영한다.
# 동시 쓰기 충돌 방지: GET → 자기 인스턴스만 merge → PATCH를 3회 반복(1초 간격).
# GitHub Variables API에는 CAS가 없으므로, 반복 쓰기로 최종 일관성을 보장한다.
# 충돌이 나도 다음 반복에서 최신 GET으로 다시 merge하기 때문에 결국 수렴한다.
INFRA_VAR_URL="https://api.github.com/repos/${gh_repo}/actions/variables/INFRA_STATUS"

push_infra_status() {
  local status="$1"
  local ip="$${2:-}"

  for i in 1 2 3; do
    # 1) 현재 INFRA_STATUS 가져오기
    local current
    current=$(curl -sf \
      -H "Authorization: Bearer $${GH_DEPLOY_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "$INFRA_VAR_URL" 2>/dev/null | jq -r '.value // "{}"' 2>/dev/null || echo '{}')

    # 2) 자기 인스턴스 상태만 merge
    local my_data
    if [ -n "$ip" ]; then
      my_data=$(jq -n --arg s "$status" --arg ip "$ip" '{"status":$s,"ip":$ip}')
    else
      my_data=$(jq -n --arg s "$status" '{"status":$s}')
    fi

    local merged
    merged=$(echo "$current" | jq \
      --arg name "$INSTANCE_NAME" \
      --argjson data "$my_data" \
      '.instances[$name] = $data | .updatedAt = now | todate' 2>/dev/null \
      || echo "$current")

    # 3) PATCH
    local escaped
    escaped=$(echo "$merged" | jq -Rs '.')
    curl -sf -X PATCH \
      -H "Authorization: Bearer $${GH_DEPLOY_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      -d "{\"value\": $${escaped}}" \
      "$INFRA_VAR_URL" > /dev/null 2>&1 \
      && echo "[infra-status] push ok ($INSTANCE_NAME=$status, attempt $i)" \
      || echo "[infra-status] push failed ($INSTANCE_NAME=$status, attempt $i)"

    [ $i -lt 3 ] && sleep 1
  done
}

# ── 시스템 정보 수집 ──
PRIVATE_IP=$(curl -sf --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 || echo "unknown")

# ── 1단계: 시작 보고 ──
report_status "인스턴스 시작 (IP: $PRIVATE_IP)"
push_infra_status "provisioning" "$PRIVATE_IP"

# ── 2단계: 배포 스크립트 실행 (기존 .sh 그대로) ──
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

# ── 3단계: Docker 컨테이너 상태 수집 ──
sleep 5  # 컨테이너 초기화 대기

if command -v docker &> /dev/null; then
  for ctn in $(docker ps --format '{{.Names}}' 2>/dev/null); do
    status=$(docker inspect --format='{{.State.Status}}' "$ctn" 2>/dev/null || echo "unknown")
    ports=$(docker port "$ctn" 2>/dev/null | tr '\n' ' ' || echo "no ports")
    report_status "$ctn: $status ($ports)"
  done
fi

# ── 4단계: 완료 보고 ──
report_status "가동 완료" "success"
push_infra_status "running" "$PRIVATE_IP"
