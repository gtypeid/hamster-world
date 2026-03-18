import axios from 'axios';
import type { WorkflowRunsResponse } from '../types/github';

const GITHUB_API = 'https://api.github.com';

export class GitHubService {
  private token: string;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  /**
   * 워크플로우 실행 목록 조회
   */
  async getWorkflowRuns(workflowId?: string): Promise<WorkflowRunsResponse> {
    const url = workflowId
      ? `${GITHUB_API}/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/runs`
      : `${GITHUB_API}/repos/${this.owner}/${this.repo}/actions/runs`;

    const response = await axios.get<WorkflowRunsResponse>(url, {
      headers: this.getHeaders(),
      params: {
        per_page: 100,
        created: `>=${this.getTodayStart()}`, // 오늘 실행된 것만
      },
    });

    return response.data;
  }

  /**
   * 워크플로우 트리거 (workflow_dispatch)
   */
  async triggerWorkflow(workflowId: string, ref = 'main', inputs?: Record<string, string>) {
    const url = `${GITHUB_API}/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/dispatches`;

    await axios.post(
      url,
      { ref, inputs },
      { headers: this.getHeaders() }
    );
  }

  /**
   * 오늘 시작 시간 (ISO 8601)
   */
  private getTodayStart(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }
}
