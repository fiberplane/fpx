import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { cn, isMac, noop } from "@/utils";
import { MixerHorizontalIcon, TriangleRightIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { WebSocketState } from "./useMakeWebsocketRequest";

type RequestInputProps = {
  method: string;
  handleMethodChange: (method: string) => void;
  path?: string;
  handlePathInputChange: (newPath: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isRequestorRequesting?: boolean;
  addBaseUrl: (path: string, { isWs }: { isWs?: boolean }) => string;
  formRef: React.RefObject<HTMLFormElement>;
  isWs?: boolean;
  websocketState: WebSocketState;
  disconnectWebsocket: () => void;
};

export function RequestorInput({
  method,
  handleMethodChange,
  path,
  handlePathInputChange,
  onSubmit,
  isRequestorRequesting,
  addBaseUrl,
  isWs,
  formRef,
  websocketState,
  disconnectWebsocket,
}: RequestInputProps) {
  const isWsConnected = websocketState.isConnected;
  const [value, setValue] = useState("");

  // HACK - If path changes externally, update the value here
  // This happens if the user clicks a route in the sidebar, for example,
  // or when they load a request from history
  useEffect(() => {
    const url = addBaseUrl(path ?? "", { isWs });
    setValue(url);
  }, [path, addBaseUrl, isWs]);

  const { toast } = useToast();

  const baseUrl = "http://localhost:8787"; // Define your base URL here
  const inputRef = useRef<HTMLInputElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue.startsWith(baseUrl)) {
      setValue(baseUrl);
    } else {
      setValue(inputValue);
      try {
        const url = new URL(inputValue);
        handlePathInputChange(url.pathname);
      } catch {
        // TODO - Error state? Toast?
        console.error("Invalid URL", inputValue);
      }
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex items-center justify-between rounded-md bg-muted border"
    >
      <div className="flex flex-grow items-center space-x-0">
        {isWs ? (
          <RequestMethodCombobox
            method="WS"
            handleMethodChange={noop}
            allowUserToChange={false}
          />
        ) : (
          <RequestMethodCombobox
            method={method}
            handleMethodChange={handleMethodChange}
            allowUserToChange
          />
        )}

        <div className="relative flex-grow w-full">
          <span className="absolute left-0 top-0 h-9 flex items-center py-1 pl-3 text-gray-400 font-mono text-sm border border-none shadow-none font-normal">
            {baseUrl}
          </span>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
          />
        </div>
        {/* <Input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            try {
              const url = new URL(e.target.value);
              handlePathInputChange(url.pathname);
            } catch {
              // TODO - Error state? Toast?
              console.error("Invalid URL", e.target.value);
            }
          }}
          className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
        /> */}
      </div>
      <div className="flex items-center space-x-2 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              type="submit"
              onClick={(e) => {
                if (isWsConnected) {
                  e.preventDefault();
                  disconnectWebsocket();
                  toast({
                    description: "Websocket connection closed",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isRequestorRequesting}
              variant={isWsConnected ? "destructive" : "default"}
              className={cn("p-2 md:p-2.5")}
            >
              <span className="hidden md:inline">
                {isWs ? (isWsConnected ? "Disconnect" : "Connect") : "Send"}
              </span>
              {isWs ? (
                <MixerHorizontalIcon className="md:hidden w-6 h-6" />
              ) : (
                <TriangleRightIcon className="md:hidden w-6 h-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
            align="center"
            side="left"
            sideOffset={16}
          >
            <div className="flex gap-0.5">
              <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
              <KeyboardShortcutKey>Enter</KeyboardShortcutKey>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}
