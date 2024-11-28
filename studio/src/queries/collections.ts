import {
  CollectionSchema,
  type ExtraRequestParams,
  ExtraRequestParamsSchema,
} from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const COLLECTIONS_KEY = "collections";

const CollectionItemSchema = ExtraRequestParamsSchema.extend({
  id: z.number(),
  name: z.string().nullable(),
  appRouteId: z.number(),
});

const CollectionWithAppRouteListSchema = z.array(
  CollectionSchema.extend({
    appRoutes: z.array(CollectionItemSchema),
  }),
);

export type CollectionWithAppRouteList = z.infer<
  typeof CollectionWithAppRouteListSchema
>;

export function useCollections() {
  return useQuery({
    queryKey: [COLLECTIONS_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/collections");
      const json = await response.json();
      return CollectionWithAppRouteListSchema.parse(json);
    },
  });
}

export type Route = {
  name: string;
};

async function addCollection(routes: Route | Route[]) {
  return fetch("/v0/collections", {
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

      throw resultToError(result);
    }

    const json = await r.json();
    return CollectionSchema.parse(json);
  });
}

export function useAddCollection() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
  });

  return mutation;
}

async function addItemToCollection(
  collectionId: string,
  routeId: number,
  extraParams: ExtraRequestParams,
) {
  return fetch(`/v0/collections/${collectionId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: routeId,
      ...extraParams,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      console.log("r", Array.from(r.headers.entries()));
      const result = await (r.headers
        .get("Content-Type")
        ?.startsWith("application/json")
        ? r.json()
        : r.text());

      throw resultToError(result);
    }

    return undefined;
  });
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown error";
}

function resultToError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(getErrorMessage(error));
}

export function useAddItemToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      routeId,
      extraParams,
    }: { routeId: number; extraParams: ExtraRequestParams }) =>
      addItemToCollection(collectionId, routeId, extraParams),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
    mutationKey: [collectionId, COLLECTIONS_KEY],
  });

  return mutation;
}

export function useDeleteItemFromCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ itemId }: { itemId: number }) =>
      fetch(`/v0/collections/${collectionId}/items/${itemId}`, {
        method: "DELETE",
      }).then(async (r) => {
        if (!r.ok) {
          const result = await (r.headers
            .get("Content-Type")
            ?.startsWith("application/json")
            ? r.json()
            : r.text());

          throw resultToError(result);
        }

        return undefined;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
    mutationKey: [collectionId, COLLECTIONS_KEY],
  });

  return mutation;
}

export function useDeleteCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/v0/collections/${collectionId}`, {
        method: "DELETE",
      }).then(async (r) => {
        if (!r.ok) {
          const result = await (r.headers
            .get("Content-Type")
            ?.startsWith("application/json")
            ? r.json()
            : r.text());

          throw resultToError(result);
        }

        return undefined;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
    mutationKey: [collectionId, COLLECTIONS_KEY],
  });

  return mutation;
}
