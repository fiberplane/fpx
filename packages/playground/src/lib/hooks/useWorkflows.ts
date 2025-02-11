import type { ApiResponse, Workflow } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../api";

export const WORKFLOWS_KEY = "workflows";

export const workflowsQueryOptions = () => ({
  queryKey: [WORKFLOWS_KEY],
  queryFn: () => api.getWorkflows(),
  select: (response: ApiResponse<Workflow[]>) => response.data,
});

export function useWorkflows() {
  return useQuery(workflowsQueryOptions());
}

export const workflowQueryOptions = (workflowId: string) => ({
  queryKey: [WORKFLOWS_KEY, workflowId],
  queryFn: () => api.getWorkflow(workflowId),
  select: (response: ApiResponse<Workflow>) => response.data,
  enabled: !!workflowId,
});

export function useWorkflow(id: string) {
  return useQuery(workflowQueryOptions(id));
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: api.createWorkflow,
    onSuccess: (response: ApiResponse<Workflow>) => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      navigate({
        to: "/workflows/$workflowId",
        params: { workflowId: response.data.workflowId },
      });
    },
  });
}

export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      prompt: string;
      openApiSchemaId: string;
      summary?: string;
      description?: string;
    }) => api.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY, id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: api.deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      navigate({ to: "/workflows" });
    },
  });
}

export interface ExecuteStepParams {
  stepId: string;
  url: string;
  method: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface ExecuteStepResult {
  stepId: string;
  data: unknown;
  headers: Record<string, string>;
  status: number;
}

export function useExecuteStep() {
  return useMutation({
    mutationKey: ["executeStep"] as const,
    mutationFn: async ({
      stepId,
      url,
      method,
      body,
      headers = {},
    }: ExecuteStepParams) => {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body && JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      return {
        stepId,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status,
      };
    },
  });
}
