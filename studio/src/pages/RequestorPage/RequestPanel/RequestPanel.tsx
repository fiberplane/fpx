import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/utils";
import { EraserIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { type Dispatch, type SetStateAction, memo, useMemo } from "react";
import { FormDataForm } from "../FormDataForm";
import { KeyValueForm } from "../KeyValueForm";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { AiTestingPersona } from "../ai";
import type { RequestorBody, RequestsPanelTab } from "../store";
import type { WebSocketState } from "../useMakeWebsocketRequest";
import { AiDropDownMenu } from "./AiDropDownMenu";
import { AIGeneratedInputsBanner } from "./AiGeneratedInputsBanner";
import { BottomToolbar } from "./BottomToolbar";
import { FileUploadForm } from "./FileUploadForm";
import { PathParamForm } from "./PathParamForm";
import "./styles.css";
import {
  CodeMirrorJsonEditor,
  CodeMirrorTextEditor,
} from "@/components/CodeMirrorEditor";
import { useRequestorStore } from "../store";
import { RouteDocumentation } from "./RouteDocumentation/RouteDocumentation";
import { isOpenApiOperation } from "./RouteDocumentation/openapi";

type RequestPanelProps = {
  aiEnabled: boolean;
  isLoadingParameters: boolean;
  fillInRequest: () => void;
  testingPersona: string;
  setTestingPersona: Dispatch<SetStateAction<AiTestingPersona>>;
  showAiGeneratedInputsBanner: boolean;
  setShowAiGeneratedInputsBanner: Dispatch<SetStateAction<boolean>>;
  setIgnoreAiInputsBanner: Dispatch<SetStateAction<boolean>>;
  websocketState: WebSocketState;
  sendWebsocketMessage: (message: string) => void;
  onSubmit: () => void;
};

export const RequestPanel = memo(function RequestPanel(
  props: RequestPanelProps,
) {
  const {
    aiEnabled,
    isLoadingParameters,
    fillInRequest,
    testingPersona,
    setTestingPersona,
    showAiGeneratedInputsBanner,
    setShowAiGeneratedInputsBanner,
    setIgnoreAiInputsBanner,
    websocketState,
    sendWebsocketMessage,
    onSubmit,
  } = props;

  const {
    path,
    body,
    method,
    setBody,
    pathParams,
    queryParams,
    requestHeaders,
    setRequestHeaders,
    setQueryParams,
    setPathParams,
    clearPathParams,
    handleRequestBodyTypeChange,
    activeRequestsPanelTab,
    setActiveRequestsPanelTab,
    websocketMessage,
    setWebsocketMessage,
    visibleRequestsPanelTabs,
    activeRoute,
  } = useRequestorStore(
    "path",
    "body",
    "method",
    "setBody",
    "pathParams",
    "queryParams",
    "requestHeaders",
    "setRequestHeaders",
    "setQueryParams",
    "setPathParams",
    "clearPathParams",
    "handleRequestBodyTypeChange",
    "activeRequestsPanelTab",
    "setActiveRequestsPanelTab",
    "websocketMessage",
    "setWebsocketMessage",
    "visibleRequestsPanelTabs",
    "activeRoute",
  );
  const { toast } = useToast();

  const shouldShowRequestTab = (tab: RequestsPanelTab): boolean => {
    return visibleRequestsPanelTabs.includes(tab);
  };

  const shouldShowBody = shouldShowRequestTab("body");
  const shouldShowMessages = shouldShowRequestTab("messages");
  const openApiSpec = useMemo(() => {
    try {
      return JSON.parse(activeRoute?.openApiSpec ?? "{}");
    } catch (_e) {
      return null;
    }
  }, [activeRoute?.openApiSpec]);
  const shouldShowDocs = isOpenApiOperation(openApiSpec);

  return (
    <Tabs
      value={activeRequestsPanelTab}
      onValueChange={setActiveRequestsPanelTab}
      className={cn(
        "border-none sm:border-r",
        "grid grid-rows-[auto_1fr]",
        // NOTE - This max-height is necessary to allow overflow to be scrollable
        "max-h-full",
      )}
    >
      <CustomTabsList>
        <CustomTabTrigger value="params">
          Params
          {queryParams?.length > 1 && (
            <span className="ml-1 font-mono text-xs text-gray-400">
              ({queryParams.length - 1})
            </span>
          )}
        </CustomTabTrigger>
        <CustomTabTrigger value="headers">
          Headers
          {requestHeaders?.length > 1 && (
            <span className="ml-1 font-mono text-xs text-gray-400">
              ({requestHeaders.length - 1})
            </span>
          )}
        </CustomTabTrigger>
        {shouldShowBody && (
          <CustomTabTrigger value="body">
            Body
            {!isBodyEmpty(body) && (
              <span className="inline-block w-2 h-2 ml-2 bg-orange-300 rounded-full" />
            )}
          </CustomTabTrigger>
        )}
        {shouldShowDocs && (
          <CustomTabTrigger value="docs">Docs</CustomTabTrigger>
        )}
        {shouldShowMessages && (
          <CustomTabTrigger value="messages">
            Message
            {(websocketMessage?.length ?? 0) > 0 && (
              <span className="inline-block w-2 h-2 ml-2 bg-orange-300 rounded-full" />
            )}
          </CustomTabTrigger>
        )}

        <div className="flex items-center justify-end flex-grow ml-auto text-white">
          <AiDropDownMenu
            aiEnabled={aiEnabled}
            persona={testingPersona}
            onPersonaChange={setTestingPersona}
            isLoadingParameters={isLoadingParameters}
            fillInRequest={fillInRequest}
          />
        </div>
      </CustomTabsList>
      <CustomTabsContent
        value="params"
        className={cn(
          // Need a lil bottom padding to avoid clipping the inputs of the last row in the form
          "pb-16",
        )}
      >
        <AIGeneratedInputsBanner
          showAiGeneratedInputsBanner={showAiGeneratedInputsBanner}
          setShowAiGeneratedInputsBanner={setShowAiGeneratedInputsBanner}
          setIgnoreAiInputsBanner={setIgnoreAiInputsBanner}
        />
        <PanelSectionHeader
          title="Query"
          handleClearData={() => {
            setQueryParams([]);
          }}
        />
        <KeyValueForm
          keyPlaceholder="param_name"
          keyValueParameters={queryParams}
          onChange={(params) => {
            setQueryParams(params);
          }}
          onSubmit={onSubmit}
        />
        {pathParams.length > 0 ? (
          <>
            <PanelSectionHeader
              title="Path"
              handleClearData={clearPathParams}
              className="mt-4"
            />
            <PathParamForm
              keyPlaceholder="param_name"
              keyValueParameters={pathParams}
              onChange={(params) => {
                setPathParams(params);
              }}
              onSubmit={onSubmit}
            />
          </>
        ) : null}
      </CustomTabsContent>
      <CustomTabsContent value="headers">
        <AIGeneratedInputsBanner
          showAiGeneratedInputsBanner={showAiGeneratedInputsBanner}
          setShowAiGeneratedInputsBanner={setShowAiGeneratedInputsBanner}
          setIgnoreAiInputsBanner={setIgnoreAiInputsBanner}
        />
        <PanelSectionHeader
          title="Request Headers"
          handleClearData={() => {
            setRequestHeaders([]);
          }}
        />
        <KeyValueForm
          keyPlaceholder="header-name"
          keyValueParameters={requestHeaders}
          onChange={(headers) => {
            setRequestHeaders(headers);
          }}
          onSubmit={onSubmit}
          keyInputType="header-key"
          valueInputType="header-value"
        />
      </CustomTabsContent>
      {shouldShowBody && (
        <CustomTabsContent
          value="body"
          className={cn(
            // HACK - Padding for the bottom toolbar
            "pb-16",
          )}
        >
          <AIGeneratedInputsBanner
            showAiGeneratedInputsBanner={showAiGeneratedInputsBanner}
            setShowAiGeneratedInputsBanner={setShowAiGeneratedInputsBanner}
            setIgnoreAiInputsBanner={setIgnoreAiInputsBanner}
          />
          <PanelSectionHeader
            title="Request Body"
            handleClearData={() => {
              // HACK - Setting the body to undefined will dispatch a CLEAR_BODY action
              setBody(undefined);
            }}
          />
          {body.type === "text" && (
            <CodeMirrorTextEditor
              onChange={setBody}
              value={body.value}
              maxHeight="800px"
              onSubmit={onSubmit}
            />
          )}
          {body.type === "json" && (
            <CodeMirrorJsonEditor
              onChange={(bodyValue) =>
                setBody({ type: "json", value: bodyValue })
              }
              value={body.value}
              maxHeight="800px"
              onSubmit={onSubmit}
            />
          )}
          {body.type === "form-data" && (
            <FormDataForm
              keyValueParameters={body.value}
              onChange={(params) => {
                setBody({
                  type: "form-data",
                  isMultipart: body.isMultipart,
                  value: params,
                });
              }}
              onSubmit={onSubmit}
            />
          )}
          {body.type === "file" && (
            <FileUploadForm
              file={body.value}
              onChange={(file) => {
                setBody({
                  type: "file",
                  value: file,
                });
              }}
            />
          )}
        </CustomTabsContent>
      )}
      {shouldShowDocs && (
        <CustomTabsContent value="docs">
          <RouteDocumentation openApiSpec={openApiSpec} route={activeRoute} />
        </CustomTabsContent>
      )}
      {shouldShowMessages && (
        <CustomTabsContent value="messages">
          <PanelSectionHeader
            title="Websocket Messages"
            handleClearData={() => {
              setWebsocketMessage("");
            }}
          />
          {websocketState.isConnected ? (
            <>
              <CodeMirrorJsonEditor
                onChange={setWebsocketMessage}
                value={websocketMessage}
                maxHeight="800px"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof websocketMessage !== "string") {
                      return;
                    }
                    sendWebsocketMessage(websocketMessage);
                    toast({
                      description: "WS Message sent",
                    });
                  }}
                >
                  Send Message
                </Button>
              </div>
            </>
          ) : (
            <WebSocketNotConnectedBanner />
          )}
        </CustomTabsContent>
      )}

      <BottomToolbar
        body={body}
        handleRequestBodyTypeChange={handleRequestBodyTypeChange}
        method={method}
        path={path}
        queryParams={queryParams}
        requestHeaders={requestHeaders}
      />
    </Tabs>
  );
});

type PanelSectionHeaderProps = {
  title: string;
  handleClearData?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function PanelSectionHeader({
  title,
  handleClearData,
  className,
  children,
}: PanelSectionHeaderProps) {
  return (
    <div
      className={cn(
        "uppercase justify-between text-gray-400 text-xs mb-2 flex items-center",
        className,
      )}
    >
      <span>{title}</span>

      {children}

      {handleClearData && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-3.5 w-3.5 cursor-pointer hover:text-white transition-color"
          title="Clear data"
          onClick={handleClearData}
          tabIndex={0}
        >
          <EraserIcon />
        </Button>
      )}
    </div>
  );
}

function isBodyEmpty(body: RequestorBody) {
  switch (body.type) {
    case "text":
      return !body.value || body.value.length === 0;
    case "json":
      return !body.value || body.value.length === 0;
    case "form-data":
      return !body.value || body.value.length === 0;
    case "file":
      return !body.value;
  }
}

function WebSocketNotConnectedBanner() {
  return (
    <div className="bg-primary/20 text-blue-300 text-sm px-2.5 py-4 rounded-md grid grid-cols-[auto_1fr] gap-2 mb-4">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start gap-1">
        <span className="font-semibold">WebSocket not connected</span>
        <span className="font-light">Connect to start sending messages</span>
      </div>
    </div>
  );
}
