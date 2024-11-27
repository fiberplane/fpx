import { COLLECTION_WITH_ROUTE_ID } from "@/constants";
import { matchRoutes, useLocation } from "react-router-dom";

export function useActiveCollectionEntryId() {
  const location = useLocation();
  const match = matchRoutes(
    [
      {
        path: COLLECTION_WITH_ROUTE_ID,
      },
    ],
    location.pathname,
  );
  if (match && match.length > 0) {
    return match[0].params.entryId;
  }

  return null;
}
