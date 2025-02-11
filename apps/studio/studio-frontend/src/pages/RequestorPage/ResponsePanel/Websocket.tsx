import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Timestamp } from "@/pages/RequestDetailsPage/Timestamp";
import { cn, truncateWithEllipsis } from "@/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LinkBreak2Icon,
} from "@radix-ui/react-icons";
import type { WebSocketState } from "../useMakeWebsocketRequest";

export function WebsocketMessages({
  websocketState,
}: { websocketState: WebSocketState }) {
  return (
    <div className={cn("h-full grid grid-rows-[auto_1fr]")}>
      <div className="text-sm uppercase text-gray-400">Messages</div>
      <div>
        <Table>
          <TableBody>
            {websocketState.messages.map((message, index) => (
              <TableRow key={message?.timestamp ?? index}>
                <TableCell className="w-5">
                  {message.type === "received" ? (
                    <ArrowDownIcon className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <ArrowUpIcon className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </TableCell>
                <TableCell className="truncate max-w-[120px] overflow-hidden text-ellipsis text-xs font-mono">
                  {truncateWithEllipsis(message?.data, 100)}
                </TableCell>
                <TableCell className="w-12 text-right text-gray-400 text-xs">
                  {message?.timestamp ? (
                    <div className="p-1 border rounded bg-slate-800/90">
                      <Timestamp date={message?.timestamp} />
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FailedWebsocket() {
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          Websocket connection failed
        </div>
        <div className="mt-2 text-ms text-gray-4000 text-center font-light">
          Make sure your api is up and running
        </div>
      </div>
    </div>
  );
}

export function NoWebsocketConnection() {
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="text-md text-white text-center">
        Enter a WebSocket URL and click Connect to start receiving messages
      </div>
      <div className="mt-1 sm:mt-2 text-ms text-gray-400 text-center font-light">
        You can send and view messages in the Messages tabs
      </div>
    </div>
  );
}
