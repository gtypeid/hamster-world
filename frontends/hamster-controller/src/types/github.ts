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

export interface JobStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'skipped' | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  name: string;
  started_at: string | null;
  completed_at: string | null;
  steps: JobStep[];
}

export interface JobsResponse {
  total_count: number;
  jobs: WorkflowJob[];
}

export interface UsageStats {
  totalMinutesUsed: number;
  remainingMinutes: number;
  dailyLimit: number;
  canTrigger: boolean;
}
