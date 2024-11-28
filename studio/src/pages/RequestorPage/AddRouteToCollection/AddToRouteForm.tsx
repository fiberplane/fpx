import { Button } from "@/components/ui/button";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import { useAddRouteToCollection, useCollections } from "@/queries";
import type { Collection } from "@fiberplane/fpx-types";

type Props = {
  // collectionId: string;
  onSuccess: () => void;
};

export function AddToRouteForm(props: Props) {
  // console.log(props);
  // const { collectionId, onSuccess } = props;
  // const { mutate: addAppRoute } = useAddRouteToCollection(collectionId);
  const { data: collections, isLoading } = useCollections();
  // const { isLoading } = useRoutes();
  // const { routes } = useRequestorStore("routes");
  // const { handleSubmit, register } = useForm<AddToRouteForm>({
  //   resolver: zodResolver(ValidationSchema),
  // });

  // const onInvalid: SubmitErrorHandler<AddToRouteForm> = useHandler(
  //   (errors) => {
  //     console.log("errors", errors);
  //     // const value = errors.root?.message ? [errors.root?.message] : errors.routes?.message ? [errors.routes.message] : [];
  //     setRoutesErrors(["Select at least one route."]);
  //     // console.log('errors', errors)
  //   },
  // );

  // const [routesErrors, setRoutesErrors] = useState<Array<string>>([]);
  // // console.log("routes", routes, isLoading);
  // const onSubmit: SubmitHandler<AddToRouteForm> = async (formData) => {
  //   // if (formData.routes.length) {
  //   console.log(formData.routes);
  //   await Promise.all(formData.routes.map((id) => addAppRoute(id)));
  //   console.log("all good?!?");
  //   onSuccess();
  // };
  const { activeRoute } = useRequestorStore("activeRoute");
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

  // console.log("collections", collections);
  // console.log("routesERrors", routesErrors);
  // const routeProps = register("routes");
  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg font-normal text-center">Add To Collection</h4>
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
  const { mutate: addCollection } = useAddRouteToCollection(
    collection.id.toString(),
  );
  const { activeRoute, queryParams, pathParams, body, requestHeaders } =
    useRequestorStore(
      "activeRoute",
      "queryParams",
      "pathParams",
      "body",
      "requestHeaders",
    );
  // console.log("queryParams", queryParams);
  if (!activeRoute) {
    return null;
  }

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
      <div>{collection.name}</div>
      <Button
        size={"icon-xs"}
        onClick={() => {
          addCollection({
            routeId: activeRoute?.id,
            extraParams: {
              requestQueryParams: arrayToKeyValue(queryParams),
              requestPathParams: arrayToKeyValue(pathParams),
              requestHeaders: arrayToKeyValue(requestHeaders),
              requestBody: body,
            },
          });
          props.onSuccess();
        }}
      >
        +
      </Button>
    </div>
  );
}

function arrayToKeyValue<T extends { key: string; value: string }>(
  list: T[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of list) {
    if (item.key) {
      result[item.key] = item.value;
    }
  }

  return result;
}
