import SparkleWand from "@/assets/wand-2.svg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  // DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs } from "@/components/ui/tabs";
import { useIsSmScreen } from "@/hooks";
import { cn } from "@/utils";
import { Cross2Icon, EraserIcon, InfoCircledIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { PathParamForm } from "./PathParamForm/PathParamForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "./Tabs";
import { AiTestingPersona, FRIENDLY, HOSTILE } from "./ai/ai";
import { useResizableWidth, useStyleWidth } from "./hooks";

type AiDropDownMenuProps = {
  isLoadingParameters: boolean;
  persona: string;
  onPersonaChange: (persona: AiTestingPersona) => void;
  fillInRequest: () => void;
};

function AiDropDownMenu({
  isLoadingParameters,
  persona,
  onPersonaChange,
  fillInRequest,
}: AiDropDownMenuProps) {
  const [open, setOpen] = useState(false);

  const handleValueChange = useCallback(
    (value: string) => {
      onPersonaChange(value === HOSTILE ? HOSTILE : FRIENDLY);
    },
    [onPersonaChange],
  );

  // FIXME - This isn't working to support meta + click as a shortcut
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      fillInRequest();
    } else {
      setOpen((prev) => !prev);
    }
  };

  const handleGenerateRequest = useCallback(() => {
    fillInRequest();
    setOpen(false);
  }, [fillInRequest, setOpen]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={handleTriggerClick}>
          <MagicWandIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Generate Inputs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">
          Testing Persona
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={persona}
          onValueChange={handleValueChange}
        >
          <DropdownMenuRadioItem
            value="Friendly"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonaChange(FRIENDLY);
            }}
          >
            Friendly
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="QA"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonaChange(HOSTILE);
            }}
          >
            Hostile
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <Button
            style={{
              background: "linear-gradient(90deg, #3B82F6 0%, #C53BF6 100%)",
            }}
            className="w-full text-white flex gap-2 items-center"
            // FIXME - While it's loading... show a spinner? And implement a timeout / cancel
            disabled={isLoadingParameters}
            onClick={handleGenerateRequest}
          >
            <SparkleWand className="w-4 h-4" />
            <span>{isLoadingParameters ? "Generating..." : "Generate"}</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type RequestPanelProps = {
  currentRoute?: string;
  method: string;
  body?: string;
  setBody: (body?: string) => void;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  setPath: (path: string) => void;
  setPathParams: React.Dispatch<React.SetStateAction<KeyValueParameter[]>>;
  setQueryParams: (params: KeyValueParameter[]) => void;
  setRequestHeaders: (headers: KeyValueParameter[]) => void;
  requestHeaders: KeyValueParameter[];
  aiEnabled: boolean;
  isLoadingParameters: boolean;
  fillInRequest: () => void;
  testingPersona: string;
  setTestingPersona: Dispatch<SetStateAction<AiTestingPersona>>;
  showAiGeneratedInputsBanner: boolean;
  setShowAiGeneratedInputsBanner: Dispatch<SetStateAction<boolean>>;
  setIgnoreAiInputsBanner: Dispatch<SetStateAction<boolean>>;
};

export function RequestPanel(props: RequestPanelProps) {
  const shouldBeResizable = useIsSmScreen();

  return shouldBeResizable ? (
    <ResizableRequestMeta {...props} />
  ) : (
    <RequestMeta {...props} />
  );
}

function ResizableRequestMeta(props: RequestPanelProps) {
  const { width, handleResize } = useResizableWidth(300);
  const styleWidth = useStyleWidth(width);
  return (
    <Resizable
      className="min-w-[200px] overflow-hidden h-full"
      width={width} // Initial width
      axis="x" // Restrict resizing to the horizontal axis
      onResize={handleResize}
      resizeHandles={["e"]} // Limit resize handle to just the east (right) handle
      handle={(_, ref) => (
        // Render a custom handle component, so we can indicate "resizability"
        // along the entire right side of the container
        <ResizableHandle ref={ref} />
      )}
    >
      <div style={styleWidth} className="min-w-[200px] border-r">
        <RequestMeta {...props} />
      </div>
    </Resizable>
  );
}

function RequestMeta(props: RequestPanelProps) {
  const {
    currentRoute,
    method,
    body,
    setBody,
    pathParams,
    queryParams,
    requestHeaders,
    setPath,
    setPathParams,
    setQueryParams,
    setRequestHeaders,
    aiEnabled,
    isLoadingParameters,
    fillInRequest,
    testingPersona,
    setTestingPersona,
    showAiGeneratedInputsBanner,
    setShowAiGeneratedInputsBanner,
    setIgnoreAiInputsBanner,
  } = props;
  const shouldShowBody = method !== "GET" && method !== "HEAD";
  return (
    <Tabs
      defaultValue="params"
      className={cn(
        "min-w-[200px] border-none sm:border-r",
        "grid grid-rows-[auto_1fr]",
        "overflow-hidden max-h-full",
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
            {(body?.length ?? 0) > 0 && (
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
          "pb-1",
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
              handleClearData={() => {
                setPathParams((currentPathParams) => {
                  return currentPathParams.map((param) => {
                    return {
                      ...param,
                      value: "",
                      enabled: false,
                    };
                  });
                });
              }}
              className="mt-4"
            />
            <PathParamForm
              keyValueParameters={pathParams}
              onChange={(params) => {
                setPathParams(params);
                // NOTE - This breaks the ability to ...
                if (!currentRoute) {
                  return;
                }
                let nextPath = currentRoute;
                for (const param of params) {
                  if (!param.enabled) {
                    continue;
                  }
                  nextPath = nextPath.replace(
                    param.key,
                    param.value || param.key,
                  );
                }
                setPath(nextPath);
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
        <CustomTabsContent value="body">
          <AIGeneratedInputsBanner
            showAiGeneratedInputsBanner={showAiGeneratedInputsBanner}
            setShowAiGeneratedInputsBanner={setShowAiGeneratedInputsBanner}
            setIgnoreAiInputsBanner={setIgnoreAiInputsBanner}
          />
          <PanelSectionHeader
            title="Request Body"
            handleClearData={() => {
              setBody(undefined);
            }}
          />
          <CodeMirrorJsonEditor
            onChange={setBody}
            value={body}
            maxHeight="800px"
          />
        </CustomTabsContent>
      )}
    </Tabs>
  );
}

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
        <EraserIcon
          className="h-3.5 w-3.5 cursor-pointer hover:text-white transition-color"
          onClick={() => {
            handleClearData();
          }}
        />
      )}
    </div>
  );
}

type AIGeneratedInputsBannerProps = {
  showAiGeneratedInputsBanner: boolean;
  setShowAiGeneratedInputsBanner: Dispatch<SetStateAction<boolean>>;
  setIgnoreAiInputsBanner: Dispatch<SetStateAction<boolean>>;
};

function AIGeneratedInputsBanner({
  showAiGeneratedInputsBanner,
  setShowAiGeneratedInputsBanner,
  setIgnoreAiInputsBanner,
}: AIGeneratedInputsBannerProps) {
  const onClose = () => {
    setShowAiGeneratedInputsBanner(false);
  };

  const onDontShowAgain = () => {
    setIgnoreAiInputsBanner(true);
  };

  if (!showAiGeneratedInputsBanner) {
    return null;
  }

  return (
    <div className="bg-primary/20 text-blue-300 text-sm px-2.5 py-2 rounded-md grid grid-cols-[auto_1fr_auto] gap-2 mb-4">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start">
        <span className="font-normal">Inputs generated by AI</span>
        <span className="font-light"> Hit send to view output.</span>
        <button
          className="underline mt-2 font-light"
          onClick={onDontShowAgain}
          type="button"
        >
          Don&rsquo;t show again
        </button>
      </div>
      <div>
        <Button className="p-0 h-auto" variant="ghost" size="sm" onClick={onClose}>
          <Cross2Icon className="w-3.5 h-3.5 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}