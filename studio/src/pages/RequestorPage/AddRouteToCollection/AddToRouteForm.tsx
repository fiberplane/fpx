import { useCollections } from "@/queries";
import { useStudioStore } from "../store";
import { AddToRouteFormItem } from "./AddToRouteFormItem";

type Props = {
  onSuccess: () => void;
};

export function AddToRouteForm(props: Props) {
  const { data: collections, isLoading } = useCollections();
  const { activeRoute } = useStudioStore("activeRoute");

  // No active route? Then there's nothing to do here
  if (!activeRoute) {
    console.warn("No active route");
    return <div>No matching route found</div>;
  }

  if (isLoading || !collections) {
    return <div>Loading collections...</div>;
  }

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-md text-muted-foreground">No Collections Found</p>
        <p className="text-sm text-gray-200">
          Create a collection to start grouping requests.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg font-normal text-center">Add to Collection</h4>
      <p className="text-sm text-gray-400">
        Select which collection to add the current request to
      </p>
      <div className="grid min-h-0 gap-2 py-2">
        <div className="grid gap-0.5 overflow-auto">
          {collections.map((collection) => {
            return (
              <AddToRouteFormItem
                key={collection.id}
                collectionId={collection.id}
                name={collection.name}
                onSuccess={props.onSuccess}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
