import { Icon } from "@iconify/react";

export function LogsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="p-8 rounded-lg flex flex-col items-center max-w-md text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:square-terminal"
            strokeWidth="1px"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">No logs found</h2>
        <p className="text-gray-400 mb-4 text-sm">
          There are currently no logs to display. This could be because no
          events have been logged yet, or the traces are not available.
        </p>
      </div>
    </div>
  );
}
