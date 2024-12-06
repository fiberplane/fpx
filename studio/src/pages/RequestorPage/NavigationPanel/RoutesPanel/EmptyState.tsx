import { Icon } from "@iconify/react/dist/iconify.js";
import { RefreshRoutesButton } from "./RefreshRoutesButton";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="mt-12 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:book-copy"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">No routes detected</h2>
        <div className="flex items-center mb-4">
          <RefreshRoutesButton />
        </div>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-2">
          <p className="text-gray-400 mb-4 text-sm">
            To enable route auto-detection:
          </p>
          <ol className="mb-4 flex flex-col gap-2">
            <li>
              1. Add the client library (
              <a
                className="underline"
                href="https://fiberplane.com/docs/get-started"
              >
                docs
              </a>
              )
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                npm i @fiberplane/hono-otel
              </code>
            </li>
            <li className="mt-2">
              2. Set <code>FPX_ENDPOINT</code> env var to
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                http://localhost:8788/v1/traces
              </code>
            </li>
            <li className="mt-2">
              3. Restart your application and Fiberplane Studio
            </li>
          </ol>
          <p className="text-gray-400 text-sm">
            If routes are still not detected:
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
          <p className="text-gray-400 text-sm">
            Or you can simply add a route manually by clicking the + button
          </p>
        </div>
      </div>
    </div>
  );
}
