import { DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  COLLECTION_WITH_ROUTE_ID,
  NAVIGATION_PANEL_COLLECTIONS,
  NAVIGATION_PANEL_KEY,
} from "@/constants";
import { useStudioStore } from "@/pages/RequestorPage/store";
import { useCollections } from "@/queries";
import {
  createObjectFromKeyValueParameters,
  generatePathWithSearchParams,
} from "@/utils";
import type { Collection } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Dialog } from "@radix-ui/react-dialog";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NamingRouteForm } from "./NamingRouteForm";

type Props = {
  // collectionId: string;
  onSuccess: () => void;
};

export function AddToRouteForm(props: Props) {
  const { data: collections, isLoading } = useCollections();
  const { activeRoute } = useStudioStore("activeRoute");

  // No active route? Then there's nothing to do here
  if (!activeRoute) {
    console.warn("No active route");
    return null;
  }

  if (isLoading || !collections) {
    return <div>Loading...</div>;
  }

  if (collections.length === 0) {
    return <div>Empty</div>;
  }

  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg font-normal text-center">Add to Collection</h4>
      <p className="text-sm text-gray-400">
        Select which collection to add the current request to
      </p>
      <div className="grid min-h-0 gap-2 py-2">
        <div className="grid gap-2 overflow-auto">
          {collections.map((collection) => {
            return (
              <AddToRouteFormItem
                key={collection.id}
                collection={collection}
                onSuccess={props.onSuccess}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// function AddRouteItem(props: Route)
function AddToRouteFormItem(props: {
  collection: Collection;
  onSuccess: () => void;
}) {
  const { collection } = props;
  const { activeRoute, queryParams, pathParams, body, requestHeaders } =
    useStudioStore(
      "activeRoute",
      "queryParams",
      "pathParams",
      "body",
      "requestHeaders",
    );

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const extraParams = {
    requestQueryParams: createObjectFromKeyValueParameters(queryParams),
    requestPathParams: createObjectFromKeyValueParameters(pathParams),
    requestHeaders: createObjectFromKeyValueParameters(requestHeaders),
    requestBody: body.value,
  };

  if (!activeRoute) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-1 rounded-lg hover:bg-muted cursor-pointer text-left">
        <Icon icon="lucide:folder" />
        <div>{collection.name}</div>
        <span>+</span>
      </DialogTrigger>
      <DialogContent className="w-80 max-w-screen-sm">
        <NamingRouteForm
          collectionId={collection.id.toString()}
          extraParams={extraParams}
          routeId={activeRoute.id}
          onSuccess={(entryId) => {
            setOpen(false);
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set(
              NAVIGATION_PANEL_KEY,
              NAVIGATION_PANEL_COLLECTIONS,
            );
            navigate(
              generatePathWithSearchParams(
                COLLECTION_WITH_ROUTE_ID,
                {
                  collectionId: collection.id.toString(),
                  entryId: entryId.toString(),
                },
                newSearchParams,
              ),
            );
            props.onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// function arrayToKeyValue<T extends { key: string; value: string }>(
//   list: T[],
// ): Record<string, string> {
//   const result: Record<string, string> = {};
//   for (const item of list) {
//     if (item.key) {
//       result[item.key] = item.value;
//     }
//   }

//   return result;
// }
