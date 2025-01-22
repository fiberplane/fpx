import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { EraserIcon } from "@radix-ui/react-icons";
import { memo, useMemo } from "react";
import { FormDataForm } from "../FormDataForm";
import { KeyValueForm } from "../KeyValueForm";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "../Tabs";
import type { RequestorBody, RequestsPanelTab } from "../store";
import { BottomToolbar } from "./BottomToolbar";
import { FileUploadForm } from "./FileUploadForm";
import { PathParamForm } from "./PathParamForm";
import "./styles.css";
import {
  CodeMirrorJsonEditor,
  CodeMirrorTextEditor,
} from "@/components/CodeMirrorEditor";
import { useStudioStore } from "../store";
import { AuthSelector } from "./AuthSelector";
import { Faker } from "./Faker";
import { RouteDocumentation } from "./RouteDocumentation/RouteDocumentation";
import { isOpenApiOperation } from "./RouteDocumentation/openapi";

type RequestPanelProps = {
  onSubmit: () => void;
};

export const RequestPanel = memo(function RequestPanel(
  props: RequestPanelProps,
) {
  const { onSubmit } = props;

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
    visibleRequestsPanelTabs,
    activeRoute,
  } = useStudioStore(
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
    "visibleRequestsPanelTabs",
    "activeRoute",
  );

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
    <Tabs
      value={activeRequestsPanelTab}
      onValueChange={setActiveRequestsPanelTab}
      className={cn(
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
        {shouldShowBody && (
          <CustomTabTrigger value="body">
            Body
            {!isBodyEmpty(body) && (
              <span className="inline-block w-2 h-2 ml-2 bg-accent/75 rounded-full" />
            )}
          </CustomTabTrigger>
        )}
        <CustomTabTrigger value="auth">Auth</CustomTabTrigger>
        <CustomTabTrigger value="headers">
          Headers
          {requestHeaders?.length > 1 && (
            <span className="ml-1 font-mono text-xs text-gray-400">
              ({requestHeaders.length - 1})
            </span>
          )}
        </CustomTabTrigger>
        {shouldShowDocs && (
          <CustomTabTrigger value="docs">Docs</CustomTabTrigger>
        )}

        <div className="flex items-center justify-end flex-grow ml-auto">
          <Faker />
        </div>
      </CustomTabsList>
      <CustomTabsContent
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
      <CustomTabsContent value="auth">
        <AuthSelector />
      </CustomTabsContent>
      <CustomTabsContent value="headers">
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
              onChange={(bodyValue) => {
                const requestBody = { type: "json" as const, value: bodyValue };
                setBody(requestBody);
              }}
              value={body.value}
              maxHeight="800px"
              onSubmit={onSubmit}
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
        </CustomTabsContent>
      )}
      {shouldShowDocs && (
        <CustomTabsContent value="docs">
          <RouteDocumentation openApiSpec={openApiSpec} route={activeRoute} />
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
