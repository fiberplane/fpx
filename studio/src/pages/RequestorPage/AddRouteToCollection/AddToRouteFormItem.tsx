import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  COLLECTION_WITH_ROUTE_ID,
  NAVIGATION_PANEL_COLLECTIONS,
  NAVIGATION_PANEL_KEY,
} from "@/constants";
import { useAddItemToCollection } from "@/queries";
import { createObjectFromKeyValueParameters } from "@/utils";
import type { CollectionItemParams } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { generatePath, useNavigate, useSearchParams } from "react-router-dom";
import { type NameFormData, NamingRouteForm } from "../NamingRouteForm";
import { useStudioStore } from "../store";

export function AddToRouteFormItem(props: {
  collectionId: number;
  name: string;
  onSuccess: () => void;
}) {
  const { name, collectionId } = props;
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
  const extraParams: CollectionItemParams = {
    requestQueryParams: createObjectFromKeyValueParameters(queryParams),
    requestPathParams: createObjectFromKeyValueParameters(pathParams),
    requestHeaders: createObjectFromKeyValueParameters(requestHeaders),
    requestBody: body,
  };
  const {
    mutate: addToCollection,
    failureReason: error,
    isPending,
  } = useAddItemToCollection(collectionId.toString());

  const onSubmit: SubmitHandler<NameFormData> = ({ name }) => {
    if (!activeRoute) {
      console.warn("No active route, unable to add to collection");
      return;
    }
    addToCollection(
      {
        routeId: activeRoute?.id,
        extraParams: {
          ...extraParams,
          name,
        },
      },
      {
        onSuccess: (data) => {
          setOpen(false);
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set(
            NAVIGATION_PANEL_KEY,
            NAVIGATION_PANEL_COLLECTIONS,
          );
          navigate({
            pathname: generatePath(COLLECTION_WITH_ROUTE_ID, {
              collectionId: collectionId.toString(),
              entryId: data.id.toString(),
            }),
            search: newSearchParams.toString(),
          });
          props.onSuccess();
        },
      },
    );
  };

  if (!activeRoute) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-1 rounded-lg hover:bg-muted cursor-pointer text-left">
        <Icon icon="lucide:folder" />
        <div>{name}</div>
        <span>+</span>
      </DialogTrigger>
      <DialogContent className="w-96 max-w-screen-sm">
        <NamingRouteForm
          error={error}
          isPending={isPending}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
