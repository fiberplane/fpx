import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Method } from "@/pages/RequestorPage/RequestorHistory";
import { useRoutes } from "@/pages/RequestorPage/routes";
import { useStudioStore } from "@/pages/RequestorPage/store";
import { useAddItemToCollection } from "@/queries";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { type NameFormData, NamingRouteForm } from "../NamingRouteForm";
import type { ProbedRoute } from "../types";

type Props = {
  collectionId: number;
  onSuccess: () => void;
};

export function AddRouteForm(props: Props) {
  const { collectionId, onSuccess } = props;

  const { isLoading } = useRoutes();
  const { appRoutes: routes } = useStudioStore("appRoutes");

  if (isLoading || !routes) {
    return <div>Loading...</div>;
  }

  if (routes.length === 0) {
    return <div>Empty</div>;
  }

  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg text-center">Add route</h4>
      <p>Select which routes to add.</p>
      <div className="grid min-h-0 gap-2">
        <div className="grid gap-2 overflow-auto">
          {routes.map((route) => {
            return (
              <AddRouteToFormItem
                key={route.id}
                route={route}
                collectionId={collectionId}
                onSuccess={onSuccess}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddRouteToFormItem({
  route,
  collectionId,
  onSuccess,
}: {
  route: ProbedRoute;
  collectionId: number;
  onSuccess: () => void;
}) {
  const {
    mutate: addAppRoute,
    error,
    isPending,
  } = useAddItemToCollection(collectionId);
  const [open, setOpen] = useState(false);
  const onSubmit: SubmitHandler<NameFormData> = async (formData) => {
    addAppRoute({
      routeId: route.id,
      extraParams: {
        name: formData.name,
        requestHeaders: {},
        requestPathParams: {},
        requestQueryParams: {},
        requestBody: null,
      },
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-1 rounded-lg hover:bg-muted cursor-pointer text-left">
        <Method method={route.method} />
        <div>{route.path}</div>
        <span>+</span>
      </DialogTrigger>
      <DialogContent className="w-96 max-w-screen-sm">
        <NamingRouteForm
          onSubmit={onSubmit}
          isPending={isPending}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
