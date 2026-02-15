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

# ── 시스템 정보 수집 ──
PRIVATE_IP=$(curl -sf --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 || echo "unknown")

# ── 1단계: 시작 보고 ──
report_status "인스턴스 시작 (IP: $PRIVATE_IP)"

# ── 2단계: 배포 스크립트 실행 (기존 .sh 그대로) ──
cat << 'DEPLOY_EOF' > /tmp/deploy.sh
${deploy_script}
DEPLOY_EOF

report_status "배포 스크립트 실행 시작"
if bash /tmp/deploy.sh; then
  report_status "배포 스크립트 완료"
else
  report_status "배포 스크립트 실패 (exit code: $?)" "failure"
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
