import { COLLECTION_ID_ROUTES } from "@/constants";
import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import { z } from "zod";

const idSchema = z.number().int();

export function useActiveCollectionId() {
  const ROUTES = useMemo(
    () =>
      COLLECTION_ID_ROUTES.map((route) => ({
        path: route,
      })),
    [],
  );

  const location = useLocation();
  const match = matchRoutes(ROUTES, location.pathname);
  if (match && match.length > 0) {
    // return
    const text = match[0].params.collectionId;
    const { data = null } = idSchema.safeParse(text);
    return data;
  }

  return null;
}
