import { CodeMirrorPrompt } from "@/components/CodeMirrorEditor";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { createKeyValueParameters } from "@/pages/RequestorPage/KeyValueForm/data";
import { createBodyFromAiResponse } from "@/pages/RequestorPage/ai/ai";
import { fetchAiRequestData } from "@/pages/RequestorPage/ai/generate-request-data";
import { makeProxiedRequest } from "@/pages/RequestorPage/queries/hooks/useMakeProxiedRequest";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import type { ProbedRoute } from "@/pages/RequestorPage/types";
import { isMac } from "@/utils";
import type { Completion } from "@codemirror/autocomplete";
import { Icon } from "@iconify/react";
import {
  type UseMutationResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      Workflows
    </Button>
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
    setTranslatedCommands(null);
    setPromptValue("");
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center">
      <div className="w-full max-w-lg h-72 bg-background border rounded-lg shadow-lg overflow-hidden grid grid-rows-[auto,auto,1fr,auto]">
        <PromptPanelHeader
          routesInAction={routesInAction}
          handleReset={handleReset}
        />
        <PromptPanelContent
          routesInAction={routesInAction}
          promptValue={promptValue}
          handlePromptChange={handlePromptChange}
          handlePromptSubmit={handlePromptSubmit}
          routeCompletions={routeCompletions}
          translateCommandsMutation={translateCommandsMutation}
          allRoutes={routes}
        />
      </div>
    </div>
  );
}

function PromptPanelHeader({
  routesInAction,
  handleReset,
}: {
  routesInAction: ProbedRoute[] | undefined;
  handleReset: () => void;
}) {
  return (
    <div className="pt-4 px-4 grid grid-cols-[auto,1fr] gap-2">
      {routesInAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground -ml-2"
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4" />
        </Button>
      )}
      <div>
        <h2 className="text-lg font-semibold grid grid-cols-[auto,1fr] items-center">
          {routesInAction ? "Running flow" : "User flow assistant"}
        </h2>
        {!routesInAction && (
          <p className="text-sm text-muted-foreground">
            Emulate user interaction flows and generate sequences of API calls.
          </p>
        )}
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
  translateCommandsMutation,
}: {
  routesInAction: ProbedRoute[] | undefined;
  allRoutes: ProbedRoute[];
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  routeCompletions: Completion[];
  translateCommandsMutation: UseMutationResult<
    { commands: { routeId: number }[] },
    unknown,
    string,
    unknown
  >;
}) {
  return routesInAction ? (
    <ActiveCommandsList routesInAction={routesInAction} />
  ) : (
    <PromptInput
      promptValue={promptValue}
      handlePromptChange={handlePromptChange}
      handlePromptSubmit={handlePromptSubmit}
      allRoutes={allRoutes}
      routeCompletions={routeCompletions}
      translateCommandsMutation={translateCommandsMutation}
    />
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

  const onSuccess = () => {
    if (!isLastCommand) {
      setCurrentCommandIndex((prev) => prev + 1);
    }
  };

  const onError = (error: unknown) => {
    console.error("Command execution failed for route:", currentRoute, error);
  };

  return (
    <div className="p-4 grid grid-rows-[1fr] gap-4 overflow-y-auto">
      <div className="grid grid-cols-1 gap-1 overflow-y-auto">
        {routesInAction.map((route) => (
          <ActiveCommand
            key={route.id}
            route={route}
            isActive={route === currentRoute}
            onSuccess={onSuccess}
            onError={onError}
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
}: {
  route: ProbedRoute;
  isActive: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}) {
  const { getMatchingMiddleware, serviceBaseUrl, setActiveRoute } =
    useRequestorStore(
      "getMatchingMiddleware",
      "serviceBaseUrl",
      "setActiveRoute",
    );
  const navigate = useNavigate();

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
          [],
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

  const handleRouteClick = () => {
    if (response?.traceId) {
      navigate(`/request/${response.traceId}`, { replace: true });
    } else {
      setActiveRoute(route);
      navigate("/", { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleRouteClick}
      className={`
        inline-flex items-center gap-2 rounded-lg justify-between 
        ${progress === "error" ? "border-red-500 bg-red-500/20" : ""}
        ${progress === "success" ? "border-green-500 bg-green-500/20" : ""}
        text-gray-400 border-2 hover:bg-secondary px-3 py-1 
        text-sm font-medium font-mono
      `}
    >
      <span>{`${route.method} ${route.path}`}</span>

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
    </button>
  );
}

function PromptInput({
  promptValue,
  handlePromptChange,
  handlePromptSubmit,
  allRoutes,
  routeCompletions,
  translateCommandsMutation,
}: {
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  allRoutes: ProbedRoute[];
  routeCompletions: Completion[];
  translateCommandsMutation: UseMutationResult<
    { commands: { routeId: number }[] },
    unknown,
    string,
    unknown
  >;
}) {
  return (
    <>
      <div className="pt-4 px-4 overflow-hidden">
        <CodeMirrorPrompt
          onBlur={() => {}}
          onChange={handlePromptChange}
          onSubmit={handlePromptSubmit}
          value={promptValue}
          placeholder="Enter a prompt. Use @ to reference a route."
          routes={allRoutes}
          completions={[
            {
              data: routeCompletions,
              character: "@",
            },
          ]}
          className="h-full"
        />
      </div>
      <div className="flex justify-end p-2">
        <Button
          size="sm"
          className="text-sm rounded-lg"
          onClick={handlePromptSubmit}
          disabled={translateCommandsMutation.isPending}
        >
          {translateCommandsMutation.isPending ? (
            "Running..."
          ) : (
            <>
              Run{" "}
              <span className="ml-1 inline-flex items-center">
                <KeyboardShortcutKey>
                  {isMac ? "⌘" : "Ctrl"}
                </KeyboardShortcutKey>
                <KeyboardShortcutKey>Enter</KeyboardShortcutKey>
              </span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
