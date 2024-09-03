import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/utils";
import { EraserIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { type Dispatch, type SetStateAction, memo } from "react";
import { FormDataForm } from "../FormDataForm";
import { KeyValueForm } from "../KeyValueForm";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { AiTestingPersona } from "../ai";
import type {
  RequestBodyType,
  RequestorBody,
  RequestsPanelTab,
} from "../reducer";
import type { WebSocketState } from "../useMakeWebsocketRequest";
import { AiDropDownMenu } from "./AiDropDownMenu";
import { AIGeneratedInputsBanner } from "./AiGeneratedInputsBanner";
import { BottomToolbar } from "./BottomToolbar";
import { FileUploadForm } from "./FileUploadForm";
import { PathParamForm } from "./PathParamForm";
import "./styles.css";
import { CodeMirrorJsonEditor } from "@/components/Timeline";
import { useShallow } from "zustand/react/shallow";
import { useRequestorStore } from "../store";

type RequestPanelProps = {
  activeRequestsPanelTab: RequestsPanelTab;
  setActiveRequestsPanelTab: (tab: string) => void;
  // method: RequestMethod;
  // path: string;
  shouldShowRequestTab: (tab: RequestsPanelTab) => boolean;
  // body: RequestorBody;
  // FIXME
  // setBody: (body: undefined | string | RequestorBody) => void;
  handleRequestBodyTypeChange: (
    contentType: RequestBodyType,
    isMultipart?: boolean,
  ) => void;
  // pathParams: KeyValueParameter[];
  // queryParams: KeyValueParameter[];
  // setPathParams: (params: KeyValueParameter[]) => void;
  // clearPathParams: () => void;
  // setQueryParams: (params: KeyValueParameter[]) => void;
  // setRequestHeaders: (headers: KeyValueParameter[]) => void;
  // requestHeaders: KeyValueParameter[];
  websocketMessage: string;
  setWebsocketMessage: (message: string | undefined) => void;
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
};

export const RequestPanel = memo(function RequestPanel(
  props: RequestPanelProps,
) {
  const {
    handleRequestBodyTypeChange,
    activeRequestsPanelTab,
    setActiveRequestsPanelTab,
    shouldShowRequestTab,
    // body,
    // path,
    // method,
    // setBody,
    // pathParams,
    // queryParams,
    // requestHeaders,
    // setPathParams,
    // clearPathParams,
    // setQueryParams,
    // setRequestHeaders,
    websocketMessage,
    setWebsocketMessage,
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
  } = useRequestorStore(
    useShallow(
      ({
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
      }) => ({
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
      }),
    ),
  );
  const { toast } = useToast();

  const shouldShowBody = shouldShowRequestTab("body");
  const shouldShowMessages = shouldShowRequestTab("messages");

  return (
    <Tabs
      value={activeRequestsPanelTab}
      onValueChange={setActiveRequestsPanelTab}
      className={cn(
        "border-none sm:border-r",
        "grid grid-rows-[auto_1fr]",
        "lg:overflow-hidden lg:h-full max-h-full",
      )}
    >
      <CustomTabsList>
        <CustomTabTrigger value="params">
          Params
          {queryParams?.length > 1 && (
            <span className="ml-1 text-gray-400 font-mono text-xs">
              ({queryParams.length - 1})
            </span>
          )}
        </CustomTabTrigger>
        <CustomTabTrigger value="headers">
          Headers
          {requestHeaders?.length > 1 && (
            <span className="ml-1 text-gray-400 font-mono text-xs">
              ({requestHeaders.length - 1})
            </span>
          )}
        </CustomTabTrigger>
        {shouldShowBody && (
          <CustomTabTrigger value="body">
            Body
            {!isBodyEmpty(body) && (
              <span className="ml-2 w-2 h-2 inline-block rounded-full bg-orange-300" />
            )}
          </CustomTabTrigger>
        )}
        {shouldShowMessages && (
          <CustomTabTrigger value="messages">
            Message
            {(websocketMessage?.length ?? 0) > 0 && (
              <span className="ml-2 w-2 h-2 inline-block rounded-full bg-orange-300" />
            )}
          </CustomTabTrigger>
        )}

        {aiEnabled && (
          <div className="flex-grow ml-auto flex items-center justify-end text-white">
            <AiDropDownMenu
              persona={testingPersona}
              onPersonaChange={setTestingPersona}
              isLoadingParameters={isLoadingParameters}
              fillInRequest={fillInRequest}
            />
          </div>
        )}
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
          title="Query parameters"
          handleClearData={() => {
            setQueryParams([]);
          }}
        />
        <KeyValueForm
          keyValueParameters={queryParams}
          onChange={(params) => {
            setQueryParams(params);
          }}
        />
        {pathParams.length > 0 ? (
          <>
            <PanelSectionHeader
              title="Path parameters"
              handleClearData={clearPathParams}
              className="mt-4"
            />
            <PathParamForm
              keyValueParameters={pathParams}
              onChange={(params) => {
                setPathParams(params);
              }}
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
          keyValueParameters={requestHeaders}
          onChange={(headers) => {
            setRequestHeaders(headers);
          }}
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
          {(body.type === "json" || body.type === "text") && (
            <CodeMirrorJsonEditor
              onChange={setBody}
              value={body.value}
              maxHeight="800px"
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
        "uppercase text-gray-400 text-sm mb-2 flex items-center justify-between",
        className,
      )}
    >
      <span>{title}</span>

      {children}

      {handleClearData && (
        <button
          type="button"
          className="h-3.5 w-3.5 cursor-pointer hover:text-white transition-color"
          title="Clear data"
          onClick={handleClearData}
          tabIndex={0}
        >
          <EraserIcon />
        </button>
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
