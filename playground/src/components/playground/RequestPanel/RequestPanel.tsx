import { Button } from "@/components/ui/button";
import {
  FpTabs,
  FpTabsContent,
  FpTabsList,
  FpTabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/utils";
import { EraserIcon } from "@radix-ui/react-icons";
import { memo, useMemo } from "react";
import { FormDataForm } from "../FormDataForm";
import { KeyValueForm } from "../KeyValueForm";
import type { PlaygroundBody, RequestsPanelTab } from "../store";
import { BottomToolbar } from "./BottomToolbar";
import { FileUploadForm } from "./FileUploadForm";
import { PathParamForm } from "./PathParamForm";
import "./styles.css";
import {
  CodeMirrorJsonEditor,
  CodeMirrorTextEditor,
} from "@/components/CodeMirrorEditor";
import { useHandler } from "@fiberplane/hooks";
import { useStudioStore } from "../store";
import { useApiCallData } from "../store/hooks/useStudioStore";
import { AuthSelector } from "./AuthSelector";
import { Faker } from "./Faker";
import { RouteDocumentation, isOpenApiOperation } from "./RouteDocumentation";

type RequestPanelProps = {
  onSubmit: () => void;
};

export const RequestPanel = memo(function RequestPanel(
  props: RequestPanelProps,
) {
  const { onSubmit } = props;

  const {
    path,
    method,
    setCurrentBody: setBody,
    setCurrentRequestHeaders: setRequestHeaders,
    setCurrentQueryParams: setQueryParams,
    setCurrentPathParams: setPathParams,
    clearCurrentPathParams: clearPathParams,
    handleRequestBodyTypeChange,
    activeRequestsPanelTab,
    setActiveRequestsPanelTab,
    visibleRequestsPanelTabs,
    activeRoute,
    togglePanel,
    fillInFakeData,
  } = useStudioStore(
    "path",
    "method",
    "setCurrentBody",
    "setCurrentRequestHeaders",
    "setCurrentQueryParams",
    "setCurrentPathParams",
    "clearCurrentPathParams",
    "handleRequestBodyTypeChange",
    "activeRequestsPanelTab",
    "setActiveRequestsPanelTab",
    "visibleRequestsPanelTabs",
    "activeRoute",
    "togglePanel",
    "fillInFakeData",
  );

  const { body, pathParams, queryParams, requestHeaders } = useApiCallData(
    "body",
    "pathParams",
    "queryParams",
    "requestHeaders",
  );

  const toggleSideBar = useHandler(() => {
    togglePanel("sidePanel");
  });

  const setBodyValue = useHandler((bodyValue: string | undefined) => {
    const requestBody = { type: "json" as const, value: bodyValue };
    setBody(requestBody);
  });

  const shouldShowRequestTab = (tab: RequestsPanelTab): boolean => {
    return visibleRequestsPanelTabs.includes(tab);
  };

  const shouldShowBody = shouldShowRequestTab("body");
  const openApiSpec = useMemo(() => {
    try {
      return JSON.parse(activeRoute?.openApiSpec ?? "{}");
    } catch (_e) {
      return null;
    }
  }, [activeRoute?.openApiSpec]);
  const shouldShowDocs = isOpenApiOperation(openApiSpec);

  return (
    <FpTabs
      value={activeRequestsPanelTab}
      onValueChange={setActiveRequestsPanelTab}
      className={cn(
        "grid grid-rows-[auto_1fr]",
        // NOTE - This max-height is necessary to allow overflow to be scrollable
        "max-h-full",
      )}
    >
      <FpTabsList>
        <FpTabsTrigger value="params">
          Params
          {queryParams?.length > 1 && (
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({queryParams.length - 1})
            </span>
          )}
        </FpTabsTrigger>
        {shouldShowBody && (
          <FpTabsTrigger value="body">
            Body
            {!isBodyEmpty(body) && (
              <span className="inline-block w-2 h-2 ml-2 bg-accent/75 rounded-full" />
            )}
          </FpTabsTrigger>
        )}
        <FpTabsTrigger value="auth">Auth</FpTabsTrigger>
        <FpTabsTrigger value="headers">
          Headers
          {requestHeaders?.length > 1 && (
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({requestHeaders.length - 1})
            </span>
          )}
        </FpTabsTrigger>
        {shouldShowDocs && <FpTabsTrigger value="docs">Docs</FpTabsTrigger>}

        <div className="flex items-center justify-end flex-grow ml-auto">
          <Faker />
        </div>
      </FpTabsList>
      <FpTabsContent
        value="params"
        className={cn(
          // Need a lil bottom padding to avoid clipping the inputs of the last row in the form
          "pb-16",
        )}
      >
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
          handleCmdG={fillInFakeData}
          handleCmdB={toggleSideBar}
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
              handleCmdG={fillInFakeData}
              handleCmdB={toggleSideBar}
            />
          </>
        ) : null}
      </FpTabsContent>
      <FpTabsContent value="auth">
        <AuthSelector />
      </FpTabsContent>
      <FpTabsContent value="headers">
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
          handleCmdG={fillInFakeData}
          handleCmdB={toggleSideBar}
          keyInputType="header-key"
          valueInputType="header-value"
        />
      </FpTabsContent>
      {shouldShowBody && (
        <FpTabsContent
          value="body"
          className={cn(
            // HACK - Padding for the bottom toolbar
            "pb-16",
          )}
        >
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
              handleCmdG={fillInFakeData}
              handleCmdB={toggleSideBar}
            />
          )}
          {body.type === "json" && (
            <CodeMirrorJsonEditor
              onChange={setBodyValue}
              value={body.value}
              maxHeight="800px"
              onSubmit={onSubmit}
              handleCmdG={fillInFakeData}
              handleCmdB={toggleSideBar}
            />
          )}
          {body.type === "form-data" && (
            <FormDataForm
              keyValueParameters={body.value}
              onChange={(params) => {
                const requestBody = {
                  type: "form-data" as const,
                  isMultipart: body.isMultipart,
                  value: params,
                };
                setBody(requestBody);
              }}
              onSubmit={onSubmit}
              handleCmdG={fillInFakeData}
              handleCmdB={toggleSideBar}
            />
          )}
          {body.type === "file" && (
            <FileUploadForm
              file={body.value}
              onChange={(file) => {
                const requestBody = {
                  type: "file" as const,
                  value: file,
                };
                setBody(requestBody);
              }}
            />
          )}
        </FpTabsContent>
      )}
      {shouldShowDocs && (
        <FpTabsContent value="docs">
          <RouteDocumentation openApiSpec={openApiSpec} route={activeRoute} />
        </FpTabsContent>
      )}

      <BottomToolbar
        body={body}
        handleRequestBodyTypeChange={handleRequestBodyTypeChange}
        method={method}
        path={path}
        queryParams={queryParams}
        requestHeaders={requestHeaders}
      />
    </FpTabs>
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
        "uppercase justify-between text-muted-foreground text-xs mb-2 flex items-center",
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
          className="h-3.5 w-3.5 p-0.5 cursor-pointer hover:bg-transparent transition-color"
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

function isBodyEmpty(body: PlaygroundBody) {
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
