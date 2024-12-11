import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { DashboardAuthClient } from "../../../lilo-worker/src/routes/dashboard/auth";

async function fetchSession() {
  const client = hc<DashboardAuthClient>("/internal/auth");
  const test1 = await client.session.$get();
  console.log("OMG", test1);
  const test1JSON = await test1.json();
  console.log("OMGGGG", test1JSON);
  const res = await fetch("/internal/auth/session", { credentials: "include" });
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
