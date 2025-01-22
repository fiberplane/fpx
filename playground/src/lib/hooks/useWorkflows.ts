import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Workflow, ApiResponse } from "@/types";
import { useNavigate } from "@tanstack/react-router";

export const WORKFLOWS_KEY = "workflows";

export const workflowsQueryOptions = () => ({
  queryKey: [WORKFLOWS_KEY],
  queryFn: () => api.getWorkflows(),
  select: (response: ApiResponse<Workflow[]>) => response.data,
});

export function useWorkflows() {
  return useQuery(workflowsQueryOptions());
}

export const workflowQueryOptions = (id: string) => ({
  queryKey: [WORKFLOWS_KEY, id],
  queryFn: () => api.getWorkflow(id),
  select: (response: ApiResponse<Workflow>) => response.data,
  enabled: !!id,
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
      navigate({ to: "/workflow/$workflowId", params: { workflowId: response.data.id } });
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
      navigate({ to: "/" });
    },
  });
}
