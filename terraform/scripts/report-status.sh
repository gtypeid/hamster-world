#!/bin/bash
# ============================================================================
# GitHub Deployments API 상태 보고 함수
# deploy-template.sh에서 source하여 사용
# ============================================================================

REPORT_GH_TOKEN="${GH_DEPLOY_TOKEN:-}"
REPORT_DEPLOY_ID="${DEPLOY_ID:-}"
REPORT_REPO="${GH_REPO:-}"
REPORT_INSTANCE="${INSTANCE_NAME:-unknown}"

report_status() {
  local description="$1"
  local state="${2:-in_progress}"  # in_progress | success | failure

  # 토큰 또는 deploy_id 없으면 로그만 출력
  if [ -z "$REPORT_GH_TOKEN" ] || [ -z "$REPORT_DEPLOY_ID" ]; then
    echo "[report] $REPORT_INSTANCE: $description (state=$state) [skip: no token/deploy_id]"
    return 0
  fi

  curl -sf -X POST \
    "https://api.github.com/repos/${REPORT_REPO}/deployments/${REPORT_DEPLOY_ID}/statuses" \
    -H "Authorization: token ${REPORT_GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -d "{
      \"state\": \"${state}\",
      \"description\": \"${REPORT_INSTANCE}: ${description}\"
    }" > /dev/null 2>&1 || echo "[report] API call failed: $description"
}
