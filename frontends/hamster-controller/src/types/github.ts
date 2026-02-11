export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  created_at: string;
  updated_at: string;
  run_started_at: string;
}

export interface WorkflowRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

export interface UsageStats {
  totalMinutesUsed: number;
  remainingMinutes: number;
  dailyLimit: number;
  canTrigger: boolean;
}
