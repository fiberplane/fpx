import { useQuery } from "@tanstack/react-query";

async function fetchSession() {
  const res = await fetch("/internal/auth/session", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Not authenticated");
  }
  const user = await res.json();
  return {
    user
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => fetchSession(),
    retry: false,
  });
}