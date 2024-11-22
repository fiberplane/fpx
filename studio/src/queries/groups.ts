import { GroupSchema } from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const GROUPS_KEY = "groups";

const GroupWithAppRouteListSchema = z.array(
  GroupSchema.extend({
    appRoutes: z.array(z.number()),
  }),
);

export type GroupWithAppRouteList = z.infer<typeof GroupWithAppRouteListSchema>;

export function useGroups() {
  return useQuery({
    queryKey: [GROUPS_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/groups");
      const json = await response.json();
      console.log(GroupWithAppRouteListSchema.safeParse(json));
      return GroupWithAppRouteListSchema.parse(json);
    },
  });
}

export type Route = {
  name: string;
};

async function addGroup(routes: Route | Route[]) {
  return fetch("/v0/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(routes),
  }).then(async (r) => {
    if (!r.ok) {
      const result = await (r.headers
        .get("Content-Type")
        ?.startsWith("application/json")
        ? r.json()
        : r.text());

      const message =
        typeof result === "string"
          ? result
          : result &&
              typeof result === "object" &&
              "message" in result &&
              typeof result.message === "string"
            ? result.message
            : "Unknown error";

      throw new Error(message);
    }

    const json = await r.json();
    return GroupSchema.parse(json);
  });
}

export function useAddGroup() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
  });

  return mutation;
}

async function addRouteToGroup(groupId: string, routeId: number) {
  return fetch(`/v0/groups/${groupId}/app-routes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: routeId,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      console.log("r", Array.from(r.headers.entries()));
      const result = await (r.headers
        .get("Content-Type")
        ?.startsWith("application/json")
        ? r.json()
        : r.text());

      const message =
        typeof result === "string"
          ? result
          : result &&
              typeof result === "object" &&
              "message" in result &&
              typeof result.message === "string"
            ? result.message
            : "Unknown error";

      throw new Error(message);
    }
    return undefined;
    // const json = await r.json();
    // return GroupSchema.parse(json);
  });
}

export function useAddRouteToGroup(groupId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (routeId: number) => addRouteToGroup(groupId, routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
    mutationKey: [groupId, GROUPS_KEY],
  });

  return mutation;
}
