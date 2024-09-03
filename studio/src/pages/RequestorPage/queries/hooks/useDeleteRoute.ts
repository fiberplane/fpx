import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PROBED_ROUTES_KEY } from "@/queries";

function deleteRoute({
  path,
  method,
}: {
  path: string;
  method: string;
}) {
  return fetch(`/v0/app-routes/${method}/${encodeURIComponent(path)}`, {
    method: "DELETE",
  }).then((r) => r.json());
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROBED_ROUTES_KEY] });
    },
  });

  return mutation;
}
