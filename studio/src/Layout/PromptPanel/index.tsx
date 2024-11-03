import { CodeMirrorPrompt } from "@/components/CodeMirrorEditor";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createKeyValueParameters } from "@/pages/RequestorPage/KeyValueForm/data";
import { createBodyFromAiResponse } from "@/pages/RequestorPage/ai/ai";
import type { ProxiedRequestResponse } from "@/pages/RequestorPage/queries";
import { makeProxiedRequest } from "@/pages/RequestorPage/queries/hooks/useMakeProxiedRequest";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import { isRequestorBodyType } from "@/pages/RequestorPage/store/request-body";
import type { ProbedRoute } from "@/pages/RequestorPage/types";
import { useRequestorHistory } from "@/pages/RequestorPage/useRequestorHistory";
import { isMac } from "@/utils";
import { cn } from "@/utils";
import type { Completion } from "@codemirror/autocomplete";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const createPlan = async (prompt: string) => {
  const response = await fetch("/v0/create-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    const error = new Error("Failed to create plan");
    console.error("Plan creation request failed:", {
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
  const {
    body,
    pathParams,
    plan,
    promptText,
    queryParams,
    requestHeaders,
    routes,
    setPlan,
    setPromptText,
  } = useRequestorStore(
    "body",
    "pathParams",
    "plan",
    "promptText",
    "queryParams",
    "requestHeaders",
    "routes",
    "setPlan",
    "setPromptText",
  );

  // this is the derived state of the routes that are currently in action from the prompt input (in the order they are in the prompt)
  const routesInAction = plan
    ?.flatMap((command) => routes.find((r) => r.id === command.routeId))
    .filter((route) => route !== undefined);

  // const navigate = useNavigate();

  const { toast } = useToast();

  const createPlanMutation = useMutation({
    mutationFn: createPlan,
    onError: (error) => {
      toast({
        title: "Error running composer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const routeCompletions: Completion[] = routes.map((route) => ({
    label: `[route:${route.id}]`,
    displayLabel: `${route.method} ${route.path}`,
  }));

  const handlePromptChange = (value?: string) => {
    if (value !== undefined) {
      setPromptText(value);
    }
  };

  const handlePromptSubmit = async () => {
    // Replace route references in the prompt
    const replacedPrompt = promptText.replace(
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
      // const { commands } =
      //   await translateCommandsMutation.mutateAsync(replacedPrompt);
      // setTranslatedCommands(commands);

      // NOTE - { plan, description } is the format we expect from the API
      const planResponse = await createPlanMutation.mutateAsync(replacedPrompt);
      setPlan(planResponse?.plan);

      // Start executing the pipeline
    } catch (error) {
      console.error("Failed to translate commands:", error);
    }
  };

  const handleReset = () => {
    setPromptText("");
    setPlan(undefined);
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center">
      <div className="max-w-lg w-full min-h-[400px] bg-background border rounded-lg shadow-lg overflow-hidden grid grid-rows-[auto,1fr,auto]">
        <PromptPanelHeader onReset={handleReset} />
        <div className="overflow-y-auto relative">
          <PromptPanelContent
            routesInAction={routesInAction}
            promptValue={promptText}
            handlePromptChange={handlePromptChange}
            handlePromptSubmit={handlePromptSubmit}
            routeCompletions={routeCompletions}
            allRoutes={routes}
          />
        </div>
        <PromptFooter
          handlePromptSubmit={handlePromptSubmit}
          isPending={createPlanMutation.isPending}
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
            index={index}
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
  index,
}: {
  route: ProbedRoute;
  isActive: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  previousResponses: ProxiedRequestResponse[];
  index: number;
}) {
  const {
    activePlanStepIdx,
    body,
    // NOTE - WE determine matching middleware on the backend now, do not need this! SO don't implement it
    // getMatchingMiddleware,
    pathParams,
    queryParams,
    updateMethod,
    updatePath,
    requestHeaders,
    serviceBaseUrl,
    plan,
    setActivePlanStepIdx,
    setBody,
    setPathParams,
    updatePathParamValues,
    setQueryParams,
    setRequestHeaders,
    updatePlanStep,
    workflowState,
  } = useRequestorStore(
    "activePlanStepIdx",
    "body",
    "updateMethod",
    "updatePath",
    "pathParams",
    "plan",
    "queryParams",
    "requestHeaders",
    "serviceBaseUrl",
    "setActivePlanStepIdx",
    "setBody",
    "setPathParams",
    "updatePathParamValues",
    "clearPathParams",
    "setQueryParams",
    "setRequestHeaders",
    "updatePlanStep",
    "workflowState",
  );

  const [progress, setProgress] = useState<
    "idle" | "requesting" | "success" | "error"
  >("idle");

  const { data: response } = useQuery({
    queryKey: ["runActionRoute", route.id.toString()],
    queryFn: async () => {
      try {
        setProgress("requesting");
        const request = plan?.[index];

        if (!request) {
          throw new Error("No request found for step");
        }

        const response = await makeProxiedRequest({
          addServiceUrlIfBarePath: (path: string) => `${serviceBaseUrl}${path}`,
          path: request.route.path,
          method: request.route.method,
          body:
            request.route.method === "GET" ||
            request.route.method === "HEAD" ||
            !request.payload.body
              ? { type: "text" }
              : request.payload.body,
          headers: request.payload.headers,
          queryParams: request.payload.queryParameters,
          pathParams: request.payload.pathParameters,
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
    enabled: isActive && workflowState === "executing",
    refetchOnWindowFocus: false,
  });

  const navigate = useNavigate();

  // Determine the to prop based on response and route state
  const requestHistoryRoute = `/request/${response?.traceId}?filter-tab=requests`;
  const routeRoute = `/route/${route.id}?filter-tab=routes`;
  const to = response?.traceId ? requestHistoryRoute : routeRoute;

  return (
    <Link
      // to={to}
      onClick={(e) => {
        // HACK - Since we are overriding `onClick`
        //        we need to call preventDefault to prevent a route transition
        //        because otherwise it will reset the page
        e.preventDefault();
        e.stopPropagation();
        console.log("BOOTS: Navigating to", to);

        // NOTE: kinda jank but kinda cool way to reuse the request data editor
        // UI for updating the workflow plans
        if (activePlanStepIdx) {
          updatePlanStep(activePlanStepIdx, {
            payload: {
              body: body,
              // HACK - Always json
              bodyType: {
                type: "json",
                isMultipart: false,
              },
              pathParameters: pathParams,
              queryParameters: queryParams,
              headers: requestHeaders,
            },
          });
        }
        const selectedStep = plan?.[index];
        console.log("BOOTS: Selected step", selectedStep);
        if (selectedStep) {
          // const bodyType = isRequestorBodyType(selectedStep.payload.bodyType.type)
          //   ? selectedStep.payload.bodyType.type
          //   : "json";
          if (selectedStep.payload.bodyType.type === "json") {
            console.log(
              "BOOTS: Setting JSON body to",
              selectedStep.payload.body,
            );
            setBody({
              type: "json",
              value:
                typeof selectedStep.payload.body === "string"
                  ? JSON.stringify(
                      JSON.parse(selectedStep.payload.body),
                      null,
                      2,
                    )
                  : JSON.stringify(selectedStep.payload.body ?? {}, null, 2),
            });
          } else {
            console.log(
              "BOOTS: Setting TEXT body to",
              selectedStep.payload.body,
            );
            // TODO - handle other body types
            setBody(selectedStep.payload.body);
          }

          updatePath(selectedStep.payload.path ?? selectedStep.route.path);
          console.log("BOOTS: Updating method to", selectedStep.route.method);
          updateMethod(selectedStep.route.method);

          // if (selectedStep.payload.pathParameters) {
          //   const modPathParams = selectedStep.payload.pathParameters.map(p => ({
          //     ...p,
          //     key: p.key?.startsWith(":") ? p.key : `:${p.key}`
          //   }))
          //   console.log("BOOTS: Updating path params to", modPathParams);
          //   updatePathParamValues(modPathParams);
          // } else {
          //   console.log("BOOTS: Setting path params to", selectedStep.payload.pathParameters);
          //   setPathParams(selectedStep.payload.pathParameters ?? []);
          // }
          setQueryParams(selectedStep.payload.queryParameters ?? []);
          setRequestHeaders(selectedStep.payload.headers ?? []);
        }
        setActivePlanStepIdx(index);

        // HACK - Always navigate to the route...
        // navigate(routeRoute);
        // navigate(to);
        // console.log("BOOTS: Navigating to", to);
      }}
      className={cn(
        "grid grid-cols-[auto,1fr] gap-2 items-center rounded-lg px-3 py-1",
        "text-sm font-medium font-mono text-gray-400",
        "hover:bg-secondary no-underline",
      )}
    >
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
