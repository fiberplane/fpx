import { Icon } from "@iconify/react";

export function EmptyCollectionPanel() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg px-2 py-1 bg-muted mb-2">
          <Icon
            icon="lucide:folder"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-4">No collections found</h2>
      </div>
    </div>
  );
}
