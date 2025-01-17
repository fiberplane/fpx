import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { DashboardAuthClient } from "../../../lilo-worker/src/routes/internal/auth";

async function fetchSession() {
  const client = hc<DashboardAuthClient>("/auth");
  const res = await client.session.$get();
  if (!res.ok) {
    throw new Error("Not authenticated");
  }
  const user = await res.json();
  return {
    user,
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => fetchSession(),
    retry: false,
  });
}
