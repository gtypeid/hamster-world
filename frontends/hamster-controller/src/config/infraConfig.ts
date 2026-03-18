/**
 * Infrastructure Session Configuration
 *
 * 모든 세션 관련 상수를 한곳에서 관리한다.
 * env에 값이 있으면 사용하고, 없으면 기본값을 적용한다.
 *
 * .env.local 예시:
 *   VITE_WORKFLOW_DURATION_MIN=20
 *   VITE_COOLDOWN_MIN=5
 *   VITE_MAX_SESSIONS_PER_DAY=10
 *
 * 타이밍 모델:
 *   ┌─ WORKFLOW_DURATION_MIN (전체 워크플로우 라이프타임) ─┐
 *   │  apply  │  active (사용자 가동)  │  destroy (쿨다운)  │
 *   └─────────┴───────────────────────┴───────────────────┘
 *   실제 가동 시간 = WORKFLOW_DURATION_MIN - COOLDOWN_MIN
 */

function envInt(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  if (raw == null || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * 워크플로우 전체 라이프타임 (분)
 * apply + active session + destroy 전부 포함한 총 시간.
 * GitHub Actions workflow_dispatch에 duration으로 전달된다.
 */
export const WORKFLOW_DURATION_MIN = envInt('VITE_WORKFLOW_DURATION_MIN', 20);

/** 쿨다운 버퍼 (분) — destroy 소요시간 + 안전 여유 포함 */
export const COOLDOWN_MIN = envInt('VITE_COOLDOWN_MIN', 5);

/** 하루 최대 세션 횟수 */
export const MAX_SESSIONS_PER_DAY = envInt('VITE_MAX_SESSIONS_PER_DAY', 5);

/**
 * 사용자에게 보여지는 실제 가동 시간 (분)
 * = WORKFLOW_DURATION_MIN - COOLDOWN_MIN
 * 이 시간이 지나면 destroy 단계로 진입한다.
 */
export const ACTIVE_RUNTIME_MIN = WORKFLOW_DURATION_MIN - COOLDOWN_MIN;
