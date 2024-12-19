import { useCollections } from "@/queries";
import { LoadingSpinner } from "./LoadingSpinner";

export function CollectionItemCrumb({
  collectionId,
  itemId,
  // hideLoading defaults to false
  hideLoading = false,
}: { collectionId: number; itemId: number; hideLoading?: boolean }) {
  const { data: collections, isRefetching } = useCollections();
  const collection = collections?.find((c) => c.id === collectionId);
  const collectionItem = collection?.collectionItems?.find(
    (item) => item.id === itemId,
  );

  const collectionItemName = collectionItem?.name || "Route";
  return (
    <>
      {collectionItemName}
      {!hideLoading && <LoadingSpinner loading={isRefetching} />}
    </>
  );
}
