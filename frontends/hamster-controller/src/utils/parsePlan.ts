/**
 * Terraform Plan output 파싱 유틸리티
 *
 * terraform plan 로그에서 summary (X to add, Y to change, Z to destroy)와
 * 리소스 타입별 카운트를 추출한다.
 */

export interface PlanSummary {
  toAdd: number;
  toChange: number;
  toDestroy: number;
}

export interface ResourceCount {
  type: string;   // e.g. "aws_instance"
  count: number;
}

export interface ParsedPlan {
  summary: PlanSummary;
  resources: ResourceCount[];
}

/**
 * terraform plan 출력에서 Plan summary를 파싱한다.
 * "Plan: 13 to add, 0 to change, 0 to destroy." 패턴 매칭
 */
export function parsePlanOutput(raw: string | null): ParsedPlan | null {
  if (!raw) return null;

  // 1) Summary: "Plan: X to add, Y to change, Z to destroy."
  const summaryMatch = raw.match(
    /Plan:\s*(\d+)\s*to add,\s*(\d+)\s*to change,\s*(\d+)\s*to destroy/
  );

  if (!summaryMatch) return null;

  const summary: PlanSummary = {
    toAdd: parseInt(summaryMatch[1], 10),
    toChange: parseInt(summaryMatch[2], 10),
    toDestroy: parseInt(summaryMatch[3], 10),
  };

  // 2) Resource types: "# aws_instance.hamster_db will be created" 패턴 카운트
  const resourceRegex = /# (\w+\.\w+)[\s.]/g;
  const typeCounts: Record<string, number> = {};
  let match: RegExpExecArray | null;

  while ((match = resourceRegex.exec(raw)) !== null) {
    // "aws_instance.hamster_db" → "aws_instance"
    const fullName = match[1];
    const resourceType = fullName.split('.')[0];
    typeCounts[resourceType] = (typeCounts[resourceType] || 0) + 1;
  }

  // 카운트 내림차순 정렬
  const resources: ResourceCount[] = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return { summary, resources };
}

/**
 * PlanSummary를 "13 to add, 0 to change, 0 to destroy" 문자열로 포맷
 */
export function formatPlanSummary(summary: PlanSummary): string {
  return `${summary.toAdd} to add, ${summary.toChange} to change, ${summary.toDestroy} to destroy`;
}
