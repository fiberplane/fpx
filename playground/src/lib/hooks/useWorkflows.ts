import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Workflow, ApiResponse } from "@/types";

export const WORKFLOWS_KEY = "workflows";

export const workflowsQueryOptions = () => ({
  queryKey: [WORKFLOWS_KEY],
  queryFn: () => api.getWorkflows(),
  select: (data: ApiResponse<Workflow[]>) => data.data,
});

export function useWorkflows() {
  return useQuery(workflowsQueryOptions());
}

export const workflowQueryOptions = (id: string) => ({
  queryKey: [WORKFLOWS_KEY, id],
  queryFn: () => api.getWorkflow(id),
  select: (data: ApiResponse<Workflow>) => data.data,
  enabled: !!id,
});

export function useWorkflow(id: string) {
  return useQuery(workflowQueryOptions(id));
}

export const createWorkflowMutationOptions = (queryClient: ReturnType<typeof useQueryClient>) => ({
  mutationFn: (data: {
    name: string;
    prompt: string;
    oaiSchemaId: string;
    summary?: string;
    description?: string;
  }) => api.createWorkflow(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
  },
});

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation(createWorkflowMutationOptions(queryClient));
}
