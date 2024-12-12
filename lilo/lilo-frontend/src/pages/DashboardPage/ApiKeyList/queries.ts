import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { ApiKeysRouter } from "../../../../../lilo-worker/src/routes/internal";

const apiKeysClient = hc<ApiKeysRouter>("/internal/api-keys");

const QUERY_KEY = "api-keys";

export function useGetApiKeys() {
  return useQuery({
    queryKey: [QUERY_KEY],
    // TODO - Add error handling
    queryFn: () => apiKeysClient.index.$get().then((res) => res.json()),
  });
}

export function useDeleteApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiKeysClient[":id"].$delete({
        param: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });
}

type CreateApiKeyPayload = {
  name: string;
};

export function useCreateApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) =>
      apiKeysClient.index.$post({
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });
}
