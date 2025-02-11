import { useCollections } from "@/queries";
import { Icon } from "@iconify/react";
import { LoadingSpinner } from "./LoadingSpinner";

export function CollectionCrumb({
  collectionId,
  // hideLoading defaults to false
  hideLoading = false,
}: { collectionId: number; hideLoading: boolean }) {
  const { data: collections, isRefetching } = useCollections();

  if (!Number.isNaN(collectionId)) {
    const collection = collections?.find((c) => c.id === collectionId);
    if (collection) {
      return (
        <>
          <Icon icon="lucide:folder" />
          {collection.name}
          {!hideLoading && <LoadingSpinner loading={isRefetching} />}
        </>
      );
    }
  }
  return (
    <>
      <Icon icon="lucide:folder" />
      Not found
    </>
  );
}
