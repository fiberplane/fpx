import { useQuery } from "@tanstack/react-query";
import { REQUESTOR_REQUESTS_KEY } from "./constants";

const fetchQuery = () => fetch("/v0/all-requests").then((r) => r.json());

export function useFetchRequestorRequests() {
  return useQuery({
    queryKey: [REQUESTOR_REQUESTS_KEY],
    queryFn: fetchQuery,
  });
}
