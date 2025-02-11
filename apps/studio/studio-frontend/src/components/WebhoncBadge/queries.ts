import { useQuery } from "@tanstack/react-query";
import { WEBHONC_ID_KEY } from "./const";

export function useWebhoncConnectionId() {
  return useQuery({
    queryKey: [WEBHONC_ID_KEY],
    queryFn: () => fetch("/v0/webhonc").then((r) => r.json()),
    select: (data) => data.webhoncUrl as string,
  });
}
