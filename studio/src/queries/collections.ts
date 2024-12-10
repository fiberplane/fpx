import { useStudioStore } from "@/pages/RequestorPage/store";
import { getStudioStoreState } from "@/pages/RequestorPage/store/hooks/useStudioStore";
// import { getStudioStoreState } from "@/pages/RequestorPage/store/hooks/useStudioStore";
import {
  CollectionSchema,
  type ExtraRequestParams,
  ExtraRequestParamsSchema,
} from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Simplify } from "type-fest";
import { z } from "zod";

export const COLLECTIONS_KEY = "collections";

export const CollectionItemSchema = ExtraRequestParamsSchema.extend({
  id: z.number(),
  name: z.string().nullable(),
  appRouteId: z.number(),
});

export type CollectionItem = z.infer<typeof CollectionItemSchema>;

const CollectionWithItemsListSchema = z.array(
  CollectionSchema.extend({
    collectionItems: z.array(CollectionItemSchema),
  }),
);

export type CollectionWithItemsList = z.infer<
  typeof CollectionWithItemsListSchema
>;

export function useCollections() {
  const result = useQuery({
    queryKey: [COLLECTIONS_KEY],
    queryFn: async () => {
      const response = await fetch("/v0/collections");
      const json = await response.json();
      return CollectionWithItemsListSchema.parse(json);
    },
  });
  const { data: collections } = result;
  const { setCollections } = useStudioStore("setCollections");
  useEffect(() => {
    if (!collections) {
      setCollections([]);
      return;
    }

    setCollections(collections);
  }, [setCollections, collections]);

  return result;
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

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { collectionId: string; params: { name: string } }) =>
      fetch(`/v0/collections/${data.collectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.params),
      }).then(async (r) => {
        if (!r.ok) {
          const result = await (r.headers
            .get("Content-Type")
            ?.startsWith("application/json")
            ? r.json()
            : r.text());

          throw resultToError(result);
        }

        await r.text();
        return undefined;
        // return CollectionSchema.parse(json);
      }),
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

    const data = await r.json();
    return CollectionItemSchema.parse(data);
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

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Extra request params that can be null
 *
 * If set to null the value that is stored in the store will be used
 */
export type NullableExtraRequestParams = Simplify<
  Nullable<
    Pick<
      ExtraRequestParams,
      | "name"
      | "requestBody"
      | "requestHeaders"
      | "requestQueryParams"
      | "requestPathParams"
    >
  >
>;

export function useUpdateCollectionItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      collectionId,
      itemId,
      nullableExtraParams,
    }: {
      collectionId: string;
      itemId: string;
      nullableExtraParams: NullableExtraRequestParams;
    }) => {
      // const entries = Object.entries(nullableExtraParams) as [keyof NullableExtraRequestParams, NullableExtraRequestParams[keyof NullableExtraRequestParams]][];
      const overrideValues = Object.fromEntries(
        Object.entries(nullableExtraParams).filter(
          ([_, value]) => value !== null,
        ),
      ) as ExtraRequestParams;

      const state = getStudioStoreState();
      const collection = state.collections.find(
        (c) => c.id.toString() === collectionId,
      );
      const collectionItem = collection?.collectionItems.find(
        (i) => i.id.toString() === itemId,
      );
      const extraParams: ExtraRequestParams = {
        name: collectionItem?.name ?? undefined,
        requestBody: collectionItem?.requestBody ?? undefined,
        requestHeaders: collectionItem?.requestHeaders ?? undefined,
        requestQueryParams: collectionItem?.requestQueryParams ?? undefined,
        requestPathParams: collectionItem?.requestPathParams ?? undefined,
        requestMethod: collectionItem?.requestMethod ?? undefined,
        requestRoute: collectionItem?.requestRoute ?? undefined,
        ...overrideValues,
      };
      return fetch(`/v0/collections/${collectionId}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(extraParams),
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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
    mutationKey: [COLLECTIONS_KEY, "upate-collection-item"],
  });

  return mutation;
}
