import type { WorkflowRun } from '../types/github';

/**
 * 워크플로우 실행 목록에서 총 사용 시간(분) 계산
 */
export function calculateTotalMinutes(runs: WorkflowRun[]): number {
  let totalMinutes = 0;

  for (const run of runs) {
    if (run.status === 'completed' && run.created_at && run.updated_at) {
      const start = new Date(run.created_at).getTime();
      const end = new Date(run.updated_at).getTime();
      const durationMs = end - start;
      totalMinutes += Math.ceil(durationMs / 1000 / 60); // ms -> 분
    }
  }

  return totalMinutes;
}

/**
 * 남은 시간(분) 계산
 */
export function calculateRemainingMinutes(totalUsed: number, dailyLimit: number): number {
  return Math.max(0, dailyLimit - totalUsed);
}

/**
 * 분을 "Xh Ym" 형식으로 변환
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
