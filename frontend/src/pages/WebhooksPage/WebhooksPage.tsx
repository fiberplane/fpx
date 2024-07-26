import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { BodyViewer } from "../RequestDetailsPage/BodyViewer";
import { HeaderTable } from "../RequestorPage/HeaderTable";
import { useRealtimeService } from "@/hooks";
import { useWebhoncId } from "./queries";

export function WebhooksPage() {
  const message = useRealtimeService();

  const [connectionId, setConnectionId] = useState<string | null>(null);

  const { data, isSuccess } = useWebhoncId();

  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");

  useEffect(() => {
    console.log("message", message);
    if (message?.event === "connection_open") {
      setConnectionId(message.payload.connectionId)
    }

    if (message?.event === "request_incoming") {
      setHeaders(message.payload.headers);
      setBody(JSON.stringify(message.payload.body));
    }
  }, [message]);

  return (
    <div
      className={cn(
        "h-full",
        "relative",
        "overflow-hidden",
        "overflow-y-scroll",
        "grid grid-rows-[auto_1fr]",
        "px-2 pb-4",
        "sm:px-4 sm:pb-8",
        "md:px-6",
      )}
    >
      <div className="flex flex-col gap-4 items-center justify-center p-4">
        <h2 className="text-2xl font-semibold">Webhooks</h2>
        <p>This be the url:</p>
        <p>https://webhonc.laulau.workers.dev/h/{connectionId ? connectionId :  isSuccess ? data?.webhonc : ""}</p>
        {headers && <HeaderTable headers={headers} />}
        {body && <BodyViewer body={body} />}
      </div>
    </div>
  );
}
