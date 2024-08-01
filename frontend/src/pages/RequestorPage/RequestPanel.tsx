import SparkleWand from "@/assets/SparkleWand.svg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs } from "@/components/ui/tabs";
import { useIsSmScreen } from "@/hooks";
import { cn, isMac } from "@/utils";
import {
  CaretDownIcon,
  CaretSortIcon,
  Cross2Icon,
  EraserIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Resizable } from "react-resizable";
import { CodeMirrorJsonEditor } from "./Editors";
import { FormDataForm } from "./FormDataForm";
import { KeyValueForm, KeyValueParameter } from "./KeyValueForm";
import { PathParamForm } from "./PathParamForm/PathParamForm";
import { ResizableHandle } from "./Resizable";
import { CustomTabTrigger, CustomTabsContent, CustomTabsList } from "./Tabs";
import { AiTestingPersona, FRIENDLY, HOSTILE } from "./ai";
import { useResizableWidth, useStyleWidth } from "./hooks";
import { WebSocketState } from "./useMakeWebsocketRequest";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon } from "@radix-ui/react-icons";
import type { RequestsPanelTab } from "./reducer";
import { RequestorState } from "./reducer/state";

import "./RequestPanel.css";


type RequestPanelProps = {
  activeRequestsPanelTab: RequestsPanelTab;
  setActiveRequestsPanelTab: (tab: string) => void;
  shouldShowRequestTab: (tab: RequestsPanelTab) => boolean;
  body: RequestorState["body"];
  // FIXME
  setBody: (body: undefined | string | RequestorState["body"]) => void;
  handleRequestBodyTypeChange: (contentType: RequestBodyType) => void;
  pathParams: KeyValueParameter[];
  queryParams: KeyValueParameter[];
  setPathParams: (params: KeyValueParameter[]) => void;
  clearPathParams: () => void;
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
  websocketState: WebSocketState;
  sendWebsocketMessage: (message: string) => void;
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
  // TODO - I tried setting the width based off of result of `useMedia` but I think something is wrong with that fiberplane hook,
  //        since it was matching (min-width: 1024px) even on small screens, and setting the panel too wide by default for smaller devices...
  const { width, handleResize } = useResizableWidth(320);
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
    handleRequestBodyTypeChange,
    activeRequestsPanelTab,
    setActiveRequestsPanelTab,
    shouldShowRequestTab,
    body,
    setBody,
    pathParams,
    queryParams,
    requestHeaders,
    setPathParams,
    clearPathParams,
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
    websocketState,
    sendWebsocketMessage,
  } = props;

  const { toast } = useToast();

  const shouldShowBody = shouldShowRequestTab("body");
  const shouldShowMessages = shouldShowRequestTab("messages");

  return (
    <Tabs
      value={activeRequestsPanelTab}
      onValueChange={setActiveRequestsPanelTab}
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
            {(body?.value?.length ?? 0) > 0 && (
              <span className="ml-2 w-2 h-2 inline-block rounded-full bg-orange-300" />
            )}
          </CustomTabTrigger>
        )}
        {shouldShowMessages && (
          <CustomTabTrigger value="messages">
            Message
            {/* FIXME - Use messages count instead of body length!!! */}
            {(body?.value?.length ?? 0) > 0 && (
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
            // FIXME - Change based on body type...
            handleClearData={() => {
              setBody(undefined);
            }}
          />
          {(body.type === "json" || body.type === "text") && (
            <CodeMirrorJsonEditor
              onChange={setBody}
              // FIXME - Use type guard
              value={body.value as string | undefined}
              maxHeight="800px"
            />
          )}
          {body.type === "form-data" && (
            <FormDataForm
              keyValueParameters={body.value}
              onChange={(params) => {
                setBody({
                  type: "form-data",
                  value: params,
                });
              }}
            />
          )}
          {/* HACK - This toolbar is absolutely positioned for now */}
          <BottomToolbar
            requestBodyType={body.type}
            handleRequestBodyTypeChange={handleRequestBodyTypeChange}
          />
        </CustomTabsContent>
      )}
      {shouldShowMessages && (
        <CustomTabsContent value="messages">
          <PanelSectionHeader
            title="Websocket Messages"
            handleClearData={() => {
              // FIXME - Use different form input for WS messages
              setBody(undefined);
            }}
          />
          {websocketState.isConnected ? (
            <>
              <CodeMirrorJsonEditor
                // FIXME - Use different form input for WS messages!
                onChange={setBody}
                value={body.value as string | undefined}
                maxHeight="800px"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof body !== "string") {
                      return;
                    }
                    sendWebsocketMessage(body);
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
    </Tabs>
  );
}

const BottomToolbar = ({
  requestBodyType,
  handleRequestBodyTypeChange,
}: RequestBodyTypeDropdownProps) => {
  return (
    <div className="flex justify-start gap-2 h-12 absolute w-full bottom-0 right-0 px-3 pt-1 backdrop-blur-sm">
      <RequestBodyTypeDropdown
        requestBodyType={requestBodyType}
        handleRequestBodyTypeChange={handleRequestBodyTypeChange}
      />
    </div>
  );
};

type RequestBodyType = RequestorState["body"]["type"];

type RequestBodyTypeDropdownProps = {
  requestBodyType: RequestBodyType;
  handleRequestBodyTypeChange: (contentType: RequestBodyType) => void;
};

type RequestBodyTypeOption = {
  value: RequestBodyType;
  label: string;
};

const bodyTypes: RequestBodyTypeOption[] = [
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
  { value: "form-data", label: "Form" },
  // { value: "file", label: "File" },
];

function RequestBodyTypeDropdown({
  requestBodyType,
  handleRequestBodyTypeChange,
}: RequestBodyTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const bodyTypeLabel = useMemo(() => {
    return (
      bodyTypes.find((type) => type.value === requestBodyType)?.label ?? "Body"
    );
  }, [requestBodyType]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="pl-3"
        >
          <CaretSortIcon className="w-4 h-4 mr-1" />
          {bodyTypeLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {bodyTypes.map((type) => (
                <CommandItem
                  key={type.value}
                  value={type.value}
                  onSelect={(currentValue) => {
                    handleRequestBodyTypeChange(
                      currentValue as RequestBodyType,
                    );
                    setOpen(false);
                  }}
                >
                  <span>{type.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      requestBodyType === type.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
        <Button
          className="p-0 h-auto"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <Cross2Icon className="w-3.5 h-3.5 text-gray-400" />
        </Button>
      </div>
    </div>
  );
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

  const handleGenerateRequest = useCallback(() => {
    fillInRequest();
    setOpen(false);
  }, [fillInRequest, setOpen]);

  // When the user shift+clicks of meta+clicks on the trigger,
  // automatically open the menu
  // I'm doing this because the caret is kinda hard to press...
  const { isMetaOrShiftPressed } = useIsMetaOrShiftPressed();
  const handleMagicWandButtonClick = useCallback(() => {
    if (!open && isMetaOrShiftPressed) {
      setOpen(true);
      return;
    }
    fillInRequest();
  }, [isMetaOrShiftPressed, setOpen, open, fillInRequest]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="p-2 h-auto"
              size="sm"
              onClick={handleMagicWandButtonClick}
            >
              <SparkleWand
                className={cn("w-4 h-4", { "fpx-pulse": isLoadingParameters })}
              />
            </Button>
            <DropdownMenuTrigger asChild>
              <button>
                <CaretDownIcon className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
          align="start"
        >
          Generate
          <div className="flex gap-0.5">
            <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
            <KeyboardShortcutKey>G</KeyboardShortcutKey>
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="min-w-60">
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

function useIsMetaOrShiftPressed() {
  const [isMetaOrShiftPressed, setIsMetaOrShiftPressed] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.shiftKey) {
      setIsMetaOrShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.metaKey && !e.shiftKey) {
      setIsMetaOrShiftPressed(false);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsMetaOrShiftPressed(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  return {
    isMetaOrShiftPressed,
  };
}
