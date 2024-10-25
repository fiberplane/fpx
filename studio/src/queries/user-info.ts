import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const UserInfoSchema = z.object({
  id: z.number(),
  githubUsername: z.string(),
  email: z.string().email(),
  token: z.string(),
  aiRequestCredits: z.number().optional(),
  expiresAt: z.string().nullable(),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

const USER_INFO_QUERY_KEY = "userInfo";

export function useFetchUserInfo() {
  return useQuery({
    queryKey: [USER_INFO_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/auth/user");
      const json = await response.json();
      if (json === null) {
        return null;
      }
      try {
        const user = UserInfoSchema.parse(json);
        return user;
      } catch (error) {
        console.error("Error parsing user info", error);
        return null;
      }
    },
  });
}

/**
 * Get the user info (null or UserInfo)
 * @returns The user info directly (no loading state)
 */
export function useUserInfo() {
  const { data } = useFetchUserInfo();
  return data;
}

/**
 * Logout the user
 * @returns A mutation to logout the user, deletes all tokens in the database
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/v0/auth/user", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      // Clear the user info from the cache
      queryClient.setQueryData([USER_INFO_QUERY_KEY], null);
      // Invalidate the query to refetch
      queryClient.invalidateQueries({ queryKey: [USER_INFO_QUERY_KEY] });
    },
  });
}
