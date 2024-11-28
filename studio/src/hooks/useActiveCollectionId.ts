import { COLLECTION_ID_ROUTES } from "@/constants";
// import { useRequestorStore } from "@/pages/RequestorPage/store";
import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";

export function useActiveCollectionId() {
  const collectionId = useCollectionIdFromRoute();
  return collectionId;
}

function useCollectionIdFromRoute() {
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
    return match[0].params.collectionId;
  }

  return null;
}
