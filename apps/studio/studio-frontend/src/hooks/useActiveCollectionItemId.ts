import { COLLECTION_WITH_ITEM_ID } from "@/constants";
import { matchRoutes, useLocation } from "react-router-dom";
import { z } from "zod";

const idSchema = z.number({ coerce: true }).int();

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
    const { data = null } = idSchema.safeParse(match[0].params.itemId);
    return data;
  }

  return null;
}
