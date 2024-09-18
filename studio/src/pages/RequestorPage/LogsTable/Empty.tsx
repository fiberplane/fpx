import { Icon } from "@iconify/react";

export function LogsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="p-8 rounded-lg flex flex-col items-center max-w-md text-center">
        <Icon
          icon="lucide:file-text"
          className="w-12 h-12 mb-4 text-gray-400"
        />
        <h2 className="text-xl font-semibold mb-2">No logs found</h2>
        <p className="text-gray-400 mb-4">
          There are currently no logs to display. This could be because no
          events have been logged yet, or the traces are not available.
        </p>
      </div>
    </div>
  );
}
