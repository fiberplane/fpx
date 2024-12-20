export interface Workflow {
  id: string;
  name: string;
  status: "completed" | "failed" | "pending";
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  stepId: string;
  operationPath: string;
  parameters?: Array<{
    name: string;
    in: string;
    value: string;
  }>;
  successCriteria?: Array<{
    condition: string;
  }>;
  outputs?: Record<string, string>;
  onFailure?: Array<{
    name: string;
    type: string;
    retryAfter: number;
    retryLimit: number;
  }>;
}

export interface WorkflowStatusProps {
  status: Workflow["status"];
}

export interface PromptResponse {
  uuid: string;
  prompt: string;
  userStory?: string;
  workflow: {
    steps: WorkflowStep[];
  } | null;
  promptedBy: string;
  status: "completed" | "failed" | "pending";
  error?: string;
  createdAt?: string;
  updatedAt?: string;
} 