import { useQuery } from "@tanstack/react-query";

export function useWebhoncId() {
  return useQuery({
    queryKey: ["webhoncId"],
    queryFn: () => fetch("/v0/webhonc").then((r) => r.json()),
  })
}
