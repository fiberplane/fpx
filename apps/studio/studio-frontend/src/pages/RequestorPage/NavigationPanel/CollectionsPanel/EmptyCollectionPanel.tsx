import { Icon } from "@iconify/react";

export function EmptyCollectionPanel() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="pt-4 pb-12 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg px-4 py-2 bg-muted mb-2">
          <Icon
            icon="lucide:folder"
            className="w-10 h-10 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mt-2 mb-1">No collections found</h2>
        <p className="text-sm text-gray-400 flex items-center">
          Create a collection with the{" "}
          <Icon
            icon="lucide:plus"
            className="inline-flex w-3 h-3 mx-1 text-gray-400 stroke-1"
          />{" "}
          button above
        </p>
      </div>
    </div>
  );
}
