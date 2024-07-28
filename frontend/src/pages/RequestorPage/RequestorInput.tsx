import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { cn, isMac } from "@/utils";
import {
  FilePlusIcon,
  MixerHorizontalIcon,
  TriangleRightIcon,
} from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { useAddRoutes } from "./queries";
import {
  RequestMethod,
  RequestMethodInputValue,
  RequestType,
  isWsRequest,
} from "./types";
import { WebSocketState } from "./useMakeWebsocketRequest";

type RequestInputProps = {
  method: RequestMethod;
  handleMethodChange: (method: RequestMethodInputValue) => void;
  path?: string;
  handlePathInputChange: (newPath: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isRequestorRequesting?: boolean;
  addBaseUrl: (
    path: string,
    { requestType }: { requestType: RequestType },
  ) => string;
  formRef: React.RefObject<HTMLFormElement>;
  requestType: RequestType;
  websocketState: WebSocketState;
  disconnectWebsocket: () => void;
  getIsInDraftMode: () => boolean;
};

export function RequestorInput({
  getIsInDraftMode,
  method,
  handleMethodChange,
  path,
  handlePathInputChange,
  onSubmit,
  isRequestorRequesting,
  addBaseUrl,
  requestType,
  formRef,
  websocketState,
  disconnectWebsocket,
}: RequestInputProps) {
  const { toast } = useToast();

  const isWsConnected = websocketState.isConnected;
  const [value, setValue] = useState("");

  const { mutate: addRoutes } = useAddRoutes();

  const canSaveDraftRoute = useMemo(() => {
    return !!path && getIsInDraftMode();
  }, [path, getIsInDraftMode]);

  const handleAddRoute = useCallback(() => {
    if (canSaveDraftRoute) {
      addRoutes({
        method: requestType === "websocket" ? "WS" : method,
        path: path ?? "",
        requestType: requestType,
        routeOrigin: "custom",
        handler: "",
        handlerType: "route",
      });
      toast({
        description: "Added new route",
      });
    }
  }, [addRoutes, canSaveDraftRoute, method, path, requestType, toast]);

  useHotkeys("mod+s", handleAddRoute, {
    enableOnFormTags: ["INPUT"],
    preventDefault: getIsInDraftMode(),
  });

  // HACK - If path changes externally, update the value here
  // This happens if the user clicks a route in the sidebar, for example,
  // or when they load a request from history
  useEffect(() => {
    const url = addBaseUrl(path ?? "", { requestType });
    setValue(url);
  }, [path, addBaseUrl, requestType]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex items-center justify-between rounded-md bg-muted border"
    >
      <div className="flex flex-grow items-center space-x-0">
        <RequestMethodCombobox
          method={isWsRequest(requestType) ? "WS" : method}
          handleMethodChange={handleMethodChange}
          allowUserToChange
        />
        <Input
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
        />
      </div>
      <div className="flex items-center space-x-2 p-2">
        {canSaveDraftRoute && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                type="button"
                onClick={handleAddRoute}
                disabled={isRequestorRequesting}
                variant="ghost"
                className={cn("p-1")}
              >
                <FilePlusIcon className="w-6 h-6 text-gray-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
              align="center"
              side="left"
              sideOffset={16}
            >
              <div className="flex gap-0.5">
                <span className="mr-1.5 inline-flex items-center">
                  Add Route
                </span>
                <KeyboardShortcutKey>
                  {isMac ? "⌘" : "Ctrl"}
                </KeyboardShortcutKey>{" "}
                <KeyboardShortcutKey>S</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
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
                {isWsRequest(requestType)
                  ? isWsConnected
                    ? "Disconnect"
                    : "Connect"
                  : "Send"}
              </span>
              {isWsRequest(requestType) ? (
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
