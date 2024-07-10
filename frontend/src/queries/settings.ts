import { useMutation, useQuery, useQueryClient } from "react-query";

const FPX_USER_SETTINGS_QUERY_KEY = "FPX_USER_SETTINGS";

export function useFetchSettings() {
  return useQuery({
    queryKey: [FPX_USER_SETTINGS_QUERY_KEY],
    queryFn: () => fetch("/v0/settings").then((r) => r.json()),
  });
}

function updateSettings({ content }: { content: object }) {
  return fetch("/v0/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  }).then((r) => r.json());
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      // Invalidate and refetch requestor requests
      queryClient.invalidateQueries({
        queryKey: [FPX_USER_SETTINGS_QUERY_KEY],
      });
    },
  });

  return mutation;
}
