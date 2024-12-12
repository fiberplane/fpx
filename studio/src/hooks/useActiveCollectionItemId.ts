import { COLLECTION_WITH_ITEM_ID } from "@/constants";
import { matchRoutes, useLocation } from "react-router-dom";

export function useActiveCollectionItemId() {
  const location = useLocation();
  const match = matchRoutes(
    [
      {
        path: COLLECTION_WITH_ITEM_ID,
      },
    ],
    location.pathname,
  );
  if (match && match.length > 0) {
    return match[0].params.itemId ?? null;
  }

  return null;
}
