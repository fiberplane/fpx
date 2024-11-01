import { CodeMirrorPrompt } from "@/components/CodeMirrorEditor";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createKeyValueParameters } from "@/pages/RequestorPage/KeyValueForm/data";
import { createBodyFromAiResponse } from "@/pages/RequestorPage/ai/ai";
import { fetchAiRequestData } from "@/pages/RequestorPage/ai/generate-request-data";
import type { ProxiedRequestResponse } from "@/pages/RequestorPage/queries";
import { makeProxiedRequest } from "@/pages/RequestorPage/queries/hooks/useMakeProxiedRequest";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import type { ProbedRoute } from "@/pages/RequestorPage/types";
import { useRequestorHistory } from "@/pages/RequestorPage/useRequestorHistory";
import { isMac } from "@/utils";
import { cn } from "@/utils";
import type { Completion } from "@codemirror/autocomplete";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const translateCommands = async (commands: string) => {
  const response = await fetch("/v0/translate-commands", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: commands,
  });

  if (!response.ok) {
    const error = new Error("Failed to translate commands");
    console.error("Translation request failed:", {
      status: response.status,
      statusText: response.statusText,
    });
    throw error;
  }

  return response.json();
};

export function PromptToggle() {
  const { togglePanel } = useRequestorStore("togglePanel");

  return (
    <Button
      variant="ghost"
      onClick={() => togglePanel("promptPanel")}
      className="gap-2 text-muted-foreground px-2 py-0"
    >
      <Icon icon="lucide:workflow" className="h-4 w-4 p-0" />
      Composer
    </Button>
  );
}

function PromptFooter({
  handlePromptSubmit,
  isPending,
}: {
  handlePromptSubmit: () => Promise<void>;
  isPending: boolean;
}) {
  return (
    <div className="border-t-1 border-gray-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 grid justify-items-end">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs rounded-lg font-mono"
        onClick={handlePromptSubmit}
        disabled={isPending}
      >
        {isPending ? (
          "Running..."
        ) : (
          <>
            Run{" "}
            <span className="ml-1 inline-flex items-center gap-1">
              <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>
              <KeyboardShortcutKey>⏎</KeyboardShortcutKey>
            </span>
          </>
        )}
      </Button>
    </div>
  );
}

export function PromptPanel() {
  const [promptValue, setPromptValue] = useState("");
  const [translatedCommands, setTranslatedCommands] = useState<
    { routeId: number }[] | null
  >(null);

  const { routes, setActiveRoute } = useRequestorStore(
    "routes",
    "setActiveRoute",
  );

  // this is the derived state of the routes that are currently in action from the prompt input (in the order they are in the prompt)
  const routesInAction = translatedCommands
    ?.flatMap((command) => routes.find((r) => r.id === command.routeId))
    .filter((route) => route !== undefined);

  const navigate = useNavigate();

  const translateCommandsMutation = useMutation({
    mutationFn: translateCommands,
  });

  const routeCompletions: Completion[] = routes.map((route) => ({
    label: `[route:${route.id}]`,
    displayLabel: `${route.method} ${route.path}`,
  }));

  const handlePromptChange = (value?: string) => {
    if (value !== undefined) {
      setPromptValue(value);
    }
  };

  const handlePromptSubmit = async () => {
    // Replace route references in the prompt
    const replacedPrompt = promptValue.replace(
      /@\[route:(\d+)\]/g,
      (match, routeId) => {
        const route = routes.find((r) => r.id === Number.parseInt(routeId, 10));
        if (route) {
          return `[Route Details:
Id: ${route.id}
Path: ${route.path}
Method: ${route.method}]
`;
        }
        console.warn("Route not found for ID:", routeId);
        return match;
      },
    );

    try {
      const { commands } =
        await translateCommandsMutation.mutateAsync(replacedPrompt);
      setTranslatedCommands(commands.commands);

      // Start executing the pipeline
    } catch (error) {
      console.error("Failed to translate commands:", error);
    }
  };

  const handleReset = () => {
    setPromptValue("");
    setTranslatedCommands(null);
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center">
      <div className="max-w-lg w-full bg-background border rounded-lg shadow-lg overflow-hidden grid grid-rows-[auto,1fr,auto]">
        <PromptPanelHeader onReset={handleReset} />
        <div className="overflow-y-auto relative">
          <PromptPanelContent
            routesInAction={routesInAction}
            promptValue={promptValue}
            handlePromptChange={handlePromptChange}
            handlePromptSubmit={handlePromptSubmit}
            routeCompletions={routeCompletions}
            allRoutes={routes}
          />
        </div>
        <PromptFooter
          handlePromptSubmit={handlePromptSubmit}
          isPending={translateCommandsMutation.isPending}
        />
      </div>
    </div>
  );
}

function PromptPanelHeader({ onReset }: { onReset: () => void }) {
  const { togglePanel } = useRequestorStore("togglePanel");

  return (
    <div className="p-4 grid grid-cols-[1fr,auto] gap-2 items-center">
      <div>
        <p className="text-xs text-muted-foreground">
          Emulate user interaction flows and generate sequences of API calls.
        </p>
      </div>
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-6 w-6 justify-self-end"
        >
          <Icon icon="lucide:eraser" className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel("promptPanel")}
          className="h-6 w-6 justify-self-end"
        >
          <Icon icon="lucide:minus" className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function PromptPanelContent({
  routesInAction,
  allRoutes,
  promptValue,
  handlePromptChange,
  handlePromptSubmit,
  routeCompletions,
}: {
  routesInAction: ProbedRoute[] | undefined;
  allRoutes: ProbedRoute[];
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  routeCompletions: Completion[];
}) {
  return (
    <div className="grid gap-4 pb-4 content-start">
      <PromptInput
        promptValue={promptValue}
        handlePromptChange={handlePromptChange}
        handlePromptSubmit={handlePromptSubmit}
        allRoutes={allRoutes}
        routeCompletions={routeCompletions}
        isCompact={!!routesInAction}
      />
      {routesInAction && <ActiveCommandsList routesInAction={routesInAction} />}
    </div>
  );
}

function ActiveCommandsList({
  routesInAction,
}: {
  routesInAction: ProbedRoute[];
}) {
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const currentRoute = routesInAction[currentCommandIndex];
  const isLastCommand = currentCommandIndex === routesInAction.length - 1;

  const { history } = useRequestorHistory();
  const previousResponses = history.slice(0, currentCommandIndex);

  const onSuccess = () => {
    if (!isLastCommand) {
      setCurrentCommandIndex((prev) => prev + 1);
    }
  };

  const onError = (error: unknown) => {
    console.error("Command execution failed for route:", currentRoute, error);
  };

  return (
    <div className="px-4 overflow-y-auto">
      <Separator decorative={true} className="my-2 dashed" />
      <div className="grid grid-cols-1 gap-1">
        {routesInAction.map((route, index) => (
          <ActiveCommand
            key={route.id}
            route={route}
            isActive={index === currentCommandIndex}
            onSuccess={onSuccess}
            onError={onError}
            previousResponses={previousResponses}
          />
        ))}
      </div>
    </div>
  );
}

function ActiveCommand({
  route,
  isActive,
  onSuccess,
  onError,
  previousResponses,
}: {
  route: ProbedRoute;
  isActive: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  previousResponses: ProxiedRequestResponse[];
}) {
  const { getMatchingMiddleware, serviceBaseUrl, setActiveRoute } =
    useRequestorStore(
      "getMatchingMiddleware",
      "serviceBaseUrl",
      "setActiveRoute",
    );

  const [progress, setProgress] = useState<
    "idle" | "generating" | "requesting" | "success" | "error"
  >("idle");

  const { data: response } = useQuery({
    queryKey: ["runActionRoute", route.id.toString()],
    queryFn: async () => {
      try {
        setProgress("generating");
        const { request } = await fetchAiRequestData(
          route,
          getMatchingMiddleware(),
          "json",
          previousResponses,
          "Friendly",
        );

        setProgress("requesting");
        const queryParams = createKeyValueParameters(request.queryParams ?? []);
        const headers = createKeyValueParameters(request.headers ?? []);
        const pathParams = createKeyValueParameters(request.pathParams ?? []);
        const body =
          createBodyFromAiResponse(request.body, request.bodyType) ?? null;

        const response = await makeProxiedRequest({
          addServiceUrlIfBarePath: (path: string) => `${serviceBaseUrl}${path}`,
          path: route.path,
          method: route.method,
          body:
            route.method === "GET" || route.method === "HEAD" || !body
              ? { type: "text" }
              : body,
          headers,
          queryParams,
          pathParams,
        });

        // Check if the request failed based on the response
        const isFailure =
          response.isFailure ||
          (response.responseStatusCode &&
            Number.parseInt(response.responseStatusCode, 10) >= 400);

        if (isFailure) {
          setProgress("error");
          return response;
        }

        setProgress("success");
        onSuccess();
        return response;
      } catch (error) {
        setProgress("error");
        onError(error);
        throw error;
      }
    },
    retry: false,
    enabled: isActive,
  });

  // Determine the to prop based on response and route state
  const to = response?.traceId
    ? `/request/${response.traceId}?filter-tab=requests`
    : `/route/${route.id}?filter-tab=routes`;

  return (
    <Link
      to={to}
      className={cn(
        "grid grid-cols-[auto,1fr] gap-2 items-center rounded-lg px-3 py-1",
        "text-sm font-medium font-mono text-gray-400",
        "hover:bg-secondary no-underline",
      )}
    >
      {progress === "generating" && (
        <Icon
          icon="lucide:loader-circle"
          className="h-4 w-4 animate-spin text-blue-500"
        />
      )}
      {progress === "requesting" && (
        <Icon
          icon="lucide:loader-circle"
          className="h-4 w-4 animate-spin text-purple-500"
        />
      )}
      {progress === "success" && (
        <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500" />
      )}
      {progress === "idle" && (
        <Icon icon="lucide:circle" className="h-4 w-4 text-gray-400" />
      )}
      {progress === "error" && (
        <Icon icon="lucide:x-circle" className="h-4 w-4 text-red-500" />
      )}

      <span className="text-left">{`${route.method} ${route.path}`}</span>
    </Link>
  );
}

function PromptInput({
  promptValue,
  handlePromptChange,
  handlePromptSubmit,
  allRoutes,
  routeCompletions,
  isCompact,
}: {
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  allRoutes: ProbedRoute[];
  routeCompletions: Completion[];
  isCompact: boolean;
}) {
  return (
    <div className="px-4">
      <CodeMirrorPrompt
        onBlur={() => {}}
        onChange={handlePromptChange}
        onSubmit={handlePromptSubmit}
        value={promptValue}
        placeholder="Describe a sequence of API calls. Use @ to add a route."
        routes={allRoutes}
        completions={[
          {
            data: routeCompletions,
            character: "@",
          },
        ]}
        className={isCompact ? "h-12" : "h-24"}
      />
    </div>
  );
}
