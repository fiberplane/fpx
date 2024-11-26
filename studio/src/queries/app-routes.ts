import { ProbedRouteSchema } from "@/pages/RequestorPage/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "./queries";

export const PROBED_ROUTES_KEY = "appRoutes";

export const refreshAppRoutes = async () => {
  try {
    const response = await fetch("/v0/refresh-app-routes", {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Is your API running?");
    }
  } catch (error) {
    console.error("Failed to refresh app routes", error);
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Unable to contact the Studio backend. Please check your network connection.",
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error");
  }
};

export function useRefreshRoutesMutation() {
  return useMutation({
    mutationFn: refreshAppRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routesFileTree"] });
    },
  });
}

// Make sure the types are modeled after the db schema
const AppRouteSchema = ProbedRouteSchema.extend({
  openApiSpec: z.string().nullish().optional(),
});

const AppRouteWithFileNameSchema = AppRouteSchema.extend({
  fileName: z.string(),
});

export type AppRouteWithFileName = z.infer<typeof AppRouteWithFileNameSchema>;

const TreeNodeSchema: z.ZodType<{
  path: string;
  routes: Array<AppRouteWithFileName>;
  children: Array<TreeNode>;
}> = z.lazy(() =>
  z.object({
    path: z.string(),
    routes: z.array(
      AppRouteWithFileNameSchema.extend({
        registrationOrder: z.number(), // Required to make the recursion types work for some reason
      }),
    ),
    children: z.array(TreeNodeSchema),
  }),
);

export type TreeNode = z.infer<typeof TreeNodeSchema>;

const AppRoutesTreeResponseSchema = z.object({
  tree: z.array(TreeNodeSchema),
  unmatched: z.array(ProbedRouteSchema),
});

export type AppRoutesTreeResponse = z.infer<typeof AppRoutesTreeResponseSchema>;

export function useFetchFileTreeRoutes() {
  return useQuery({
    queryKey: ["routesFileTree"],
    queryFn: async () => {
      const response = await fetch("/v0/app-routes-file-tree");
      const json = await response.json();
      return AppRoutesTreeResponseSchema.parse(json);
    },
    throwOnError: true,
  });
}
