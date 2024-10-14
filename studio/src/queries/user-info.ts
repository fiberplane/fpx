import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Define a schema for user info
const UserInfoSchema = z.object({
  id: z.number(),
  // username: z.string(),
  // email: z.string().email(),
  value: z.string(),
});

// type UserInfo = z.infer<typeof UserInfoSchema>;

const USER_INFO_QUERY_KEY = "userInfo";

export function useFetchUserInfo() {
  return useQuery({
    queryKey: [USER_INFO_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/auth/user");
      const json = await response.json();
      console.log("json", json);
      const user = UserInfoSchema.parse(json);
      console.log("user", user);
      return user;
    },
  });
}

export function useUserInfo() {
  const { data } = useFetchUserInfo();
  return data;
}

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
      // Optionally, invalidate the query to refetch
      queryClient.invalidateQueries({ queryKey: [USER_INFO_QUERY_KEY] });
    },
  });
}
