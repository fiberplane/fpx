import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { ProjectsRouter } from "../../../../../lilo-worker/src/routes/internal";

const projectsClient = hc<ProjectsRouter>("/internal/projects");

const QUERY_KEY = "user-projects";

export function useGetProjects() {
  return useQuery({
    queryKey: [QUERY_KEY],
    // TODO - Add error handling
    queryFn: () => projectsClient.index.$get().then((res) => res.json()),
  });
}

export function useDeleteProject() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      projectsClient[":id"].$delete({
        param: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });
}

type CreateProjectPayload = {
  name: string;
  spec: string;
};

export function useCreateProject() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectsClient.index.$post({
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });
}
