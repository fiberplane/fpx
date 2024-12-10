import { Icon } from "@iconify/react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:clock"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-4">No requests recorded</h2>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            <li>
              1. Make sure your app is running and connected to the Fiberplane
              Studio using the client library
            </li>
            <li className="mt-2">
              2. Send an API request to one your app's endpoints
            </li>
            <li className="mt-2">3. Requests will appear here automatically</li>
          </ol>
          <p className="text-gray-400 text-sm">
            If requests are still not appearing:
          </p>
          <ul className="text-left text-sm text-gray-400">
            <li>
              - Ask for help on{" "}
              <a
                href="https://discord.com/invite/cqdY6SpfVR"
                className="underline"
              >
                Discord
              </a>
            </li>
            <li>
              - File an issue on{" "}
              <a
                href="https://github.com/fiberplane/fpx/issues"
                className="underline"
              >
                Github
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
