import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export const WORKFLOWS_KEY = "workflows";

export function useWorkflows() {
  return useQuery({
    queryKey: [WORKFLOWS_KEY],
    queryFn: () => api.getWorkflows(),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: [WORKFLOWS_KEY, id],
    queryFn: () => api.getWorkflow(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userStory: string) => api.createWorkflow(userStory),
    onSuccess: () => {
      // Invalidate and refetch workflows list
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
    },
  });
}
