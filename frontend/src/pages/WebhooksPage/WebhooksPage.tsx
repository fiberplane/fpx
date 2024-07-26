import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket"
import { HeaderTable } from "../RequestorPage/HeaderTable";
import { BodyViewer } from "../RequestDetailsPage/BodyViewer";
import { cn } from "@/utils";

export function WebhooksPage() {
  const { lastMessage, lastJsonMessage } = useWebSocket("wss://webhonc.laulau.workers.dev/", {
    heartbeat: true,
    onOpen: () => { console.log("ws with proxy open") },
    onClose: () => { console.log("ws with proxy closed") },
    onError: (err) => { console.log("ws with proxy error", err) },
  });

  const [clientId, setClientId] = useState<string>("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");

  useEffect(() => {
    if (lastJsonMessage && typeof lastJsonMessage === "object" && "clientId" in lastJsonMessage) {
      setClientId(lastJsonMessage.clientId as string);
    }

    if (lastJsonMessage && typeof lastJsonMessage === "object") {
      setHeaders(lastJsonMessage.headers);
      setBody(JSON.stringify(lastJsonMessage.body));
    }
    console.log(lastMessage)
  }, [lastJsonMessage]);


  return <div
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
      <p>
        https://webhonc.laulau.workers.dev/h/{clientId}
      </p>
      {headers && <HeaderTable headers={headers} />}
      {body && <BodyViewer body={body} />}
    </div></div>;
}
