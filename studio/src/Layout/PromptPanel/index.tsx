import { CodeMirrorPrompt } from "@/components/CodeMirrorEditor";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import type { ProxiedRequestResponse } from "@/pages/RequestorPage/queries";
import { makeProxiedRequest } from "@/pages/RequestorPage/queries/hooks/useMakeProxiedRequest";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import type {
  Plan,
  PlanStep,
  PromptWorkflowState,
} from "@/pages/RequestorPage/store/slices/types";
import type { RequestorActiveResponse } from "@/pages/RequestorPage/store/types";
import type { ProbedRoute } from "@/pages/RequestorPage/types";
import { useRequestorHistory } from "@/pages/RequestorPage/useRequestorHistory";
import { isMac } from "@/utils";
import { cn } from "@/utils";
import type { Completion } from "@codemirror/autocomplete";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const createPlan = async (
  prompt: string,
  messages?: { role: "user" | "assistant"; content: string }[],
) => {
  const response = await fetch("/v0/create-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      messages,
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

const evaluateStepResponse = async (
  plan: Plan,
  currentStepIdx: number,
  stepResponse: RequestorActiveResponse,
) => {
  const response = await fetch("/v0/evaluate-step-response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan,
      currentStepIdx,
      response: stepResponse,
    }),
  });

  if (!response.ok) {
    const error = new Error("Failed to evaluate step response");
    console.error("Step response evaluation request failed:", {
      status: response.status,
      statusText: response.statusText,
    });
    throw error;
  }

  return response.json();
};

const evaluatePlanStep = async (
  plan: Plan,
  currentStepIdx: number,
  previousResults: RequestorActiveResponse[],
) => {
  const response = await fetch("/v0/evaluate-next-step", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan,
      currentStepIdx,
      previousResults,
    }),
  });

  if (!response.ok) {
    const error = new Error("Failed to evaluate plan step");
    console.error("Plan evaluation request failed:", {
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
    executingPlanStepIdx,
    setPlanStepProgress,
    routes,
    setPlan,
    setPromptText,
    incrementExecutingPlanStepIdx,
    setWorkflowState,
    serviceBaseUrl,
    clearPlan,
    setPlanStepResponse,
    setExecutingPlanStepIdx,
    planStepResponseMap,
    updatePlanStep,
    workflowState,
    getPlanStepProgress,
    shouldKeepGoing,
    setShouldKeepGoing,
    setAwaitingInputMessage,
    addPromptMessage,
    setPromptMessages,
    promptMessages,
  } = useRequestorStore(
    "body",
    "workflowState",
    "pathParams",
    "plan",
    "promptText",
    "queryParams",
    "requestHeaders",
    "routes",
    "setPlan",
    "setPromptText",
    "executingPlanStepIdx",
    "incrementExecutingPlanStepIdx",
    "setWorkflowState",
    "serviceBaseUrl",
    "setPlanStepProgress",
    "clearPlan",
    "setPlanStepResponse",
    "setExecutingPlanStepIdx",
    "planStepResponseMap",
    "updatePlanStep",
    "getPlanStepProgress",
    "shouldKeepGoing",
    "setShouldKeepGoing",
    "awaitingInputMessage",
    "setAwaitingInputMessage",
    "addPromptMessage",
    "setPromptMessages",
    "promptMessages",
  );

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

  // Effect that sets workflow state to completed if we have executed all steps
  useEffect(() => {
    if (
      plan &&
      executingPlanStepIdx &&
      executingPlanStepIdx > plan?.steps.length - 1
    ) {
      setWorkflowState("completed");
    }
  }, [setWorkflowState, executingPlanStepIdx, plan]);

  /**
   * Callback that will execute a single step of the plan
   */
  const executePlanStep = useCallback(
    async (index: number, shouldAwaitAfter = true) => {
      setWorkflowState("executing");

      // Simple logging when we fail
      const onError = (error: unknown) => {
        const currentRoute = plan?.steps?.[executingPlanStepIdx ?? 0];
        console.error(
          "Command execution failed for route:",
          currentRoute,
          error,
        );
      };

      try {
        setPlanStepProgress(index, "requesting");
        let request = plan?.steps?.[index];

        if (index && plan && index > plan.steps.length - 1) {
          setWorkflowState("completed");
          setShouldKeepGoing(false);
        }

        if (!request) {
          if (index === plan?.steps.length) {
            setWorkflowState("completed");
            setShouldKeepGoing(false);
          } else {
            throw new Error("No request found for step");
          }
        }

        if (!plan) {
          throw new Error("No plan!");
        }

        const previousResponses: RequestorActiveResponse[] = [];
        for (let i = 0; i < index; i++) {
          const prevRes = planStepResponseMap?.[i];
          if (prevRes) {
            previousResponses.push(prevRes);
          }
        }

        const evaluationResponse = await evaluatePlanStep(
          plan,
          index,
          previousResponses,
        );
        console.log("BOOTS: Evaluation response", evaluationResponse);

        if (
          evaluationResponse?.action !== "execute" &&
          evaluationResponse?.action !== "awaitInput"
        ) {
          setWorkflowState("error");
          setShouldKeepGoing(false);
          throw new Error("I do not know what to do");
        }

        if (evaluationResponse?.action === "awaitInput") {
          // TODO - Implement this
          setWorkflowState("awaitingInput");
          setPlanStepProgress(index, "warning");

          return;
        }

        // EXECUTE MODIFIED STEP - this will have filled in and updated template vars
        if (evaluationResponse?.action === "execute") {
          // HACK - Coerce type
          const modifiedStep: PlanStep = evaluationResponse.modifiedStep;

          // NOTE - Update step in store! for accurate history
          updatePlanStep(index, modifiedStep);

          request = modifiedStep ?? request;

          const response = await makeProxiedRequest({
            addServiceUrlIfBarePath: (path: string) =>
              `${serviceBaseUrl}${path}`,
            path: request.payload.path ?? request.route.path,
            method: request.route.method,
            body:
              request.route.method === "GET" ||
              request.route.method === "HEAD" ||
              !request.payload.body
                ? { type: "json" }
                : {
                    type: "json",
                    value:
                      typeof request.payload.body === "string"
                        ? JSON.stringify(JSON.parse(request.payload.body))
                        : JSON.stringify(request.payload.body),
                  },
            headers: request.payload.headers ?? [
              { key: "Content-Type", value: "application/json" },
            ],
            queryParams: request.payload.queryParameters ?? [],
            pathParams: request.payload.pathParameters ?? [],
          });

          // TODO - evaluate failure using ai...
          const responseEvaluation = await evaluateStepResponse(
            plan,
            index,
            response,
          );

          console.log(
            "BOOTS: Step response evaluation response",
            evaluationResponse,
          );

          const shouldContinue = responseEvaluation?.action === "continue";
          const shouldAwaitInput = responseEvaluation?.action === "awaitInput";

          if (!shouldContinue && !shouldAwaitInput) {
            setWorkflowState("error");
            throw new Error("I do not know what to do");
          }

          if (shouldAwaitInput) {
            setShouldKeepGoing(false);
            setWorkflowState("awaitingInput");
            setAwaitingInputMessage(responseEvaluation?.message);
            toast({
              title: "Awaiting input",
              description: responseEvaluation?.message ?? "No message",
            });
            return;
          }

          // OLD CODE - Automatically fails...
          //
          // Check if the request failed based on the response
          // const isFailure =
          //   response.isFailure ||
          //   (response.responseStatusCode &&
          //     Number.parseInt(response.responseStatusCode, 10) >= 400);

          // if (isFailure) {
          //   setPlanStepProgress(index, "error");
          //   setShouldKeepGoing(false);
          //   setPlanStepResponse(index, response);
          //   return response;
          // }

          setPlanStepProgress(index, "success");
          setPlanStepResponse(index, response);
          // TODO - Remove for "ENTIRE PLAN" flow... depends if we want to step or not
          if (shouldAwaitAfter) {
            setWorkflowState("awaitingInput");
            incrementExecutingPlanStepIdx();
          } else {
            incrementExecutingPlanStepIdx();
          }
          return response;
        }
      } catch (error) {
        setPlanStepProgress(index, "error");
        setShouldKeepGoing(false);
        setWorkflowState("error");
        onError(error);
        throw error;
      }
    },
    [
      setShouldKeepGoing,
      plan,
      executingPlanStepIdx,
      planStepResponseMap,
      setPlanStepProgress,
      setPlanStepResponse,
      setWorkflowState,
      updatePlanStep,
      serviceBaseUrl,
      incrementExecutingPlanStepIdx,
      setAwaitingInputMessage,
    ],
  );

  useEffect(() => {
    if (executingPlanStepIdx === undefined) {
      return;
    }

    if (workflowState !== "executing") {
      return;
    }

    const progress = getPlanStepProgress(executingPlanStepIdx);

    if (progress === "idle") {
      executePlanStep(executingPlanStepIdx, !shouldKeepGoing);
    }
  }, [
    executingPlanStepIdx,
    workflowState,
    getPlanStepProgress,
    executePlanStep,
    shouldKeepGoing,
  ]);

  const { setActivePlanStepIdx } = useRequestorStore("setActivePlanStepIdx");

  const executeNextStep = () => {
    setActivePlanStepIdx(undefined);
    // TODO - if paused, increment?
    setShouldKeepGoing(false);
    setWorkflowState("executing");
    if (executingPlanStepIdx === undefined) {
      setExecutingPlanStepIdx(0);
      executePlanStep(0);
    } else {
      if (executingPlanStepIdx === (plan?.steps?.length ?? 0) - 1) {
        setWorkflowState("completed");
        setShouldKeepGoing(false);
      } else {
        executePlanStep(executingPlanStepIdx, true);
      }
    }
  };

  const executeEntirePlan = () => {
    setActivePlanStepIdx(undefined);
    setShouldKeepGoing(true);
    setWorkflowState("executing");
    if (executingPlanStepIdx === undefined) {
      setExecutingPlanStepIdx(0);
      executePlanStep(0, false);
    } else {
      executePlanStep(executingPlanStepIdx, false);
    }
  };

  const handlePromptSubmit = async () => {
    setActivePlanStepIdx(undefined);
    // HACK - If we have a plan loaded and the user submits, we start executing it.
    if (plan && workflowState !== "awaitingInput") {
      setWorkflowState("executing");
      console.log("BOOTS: Executing plan step", executingPlanStepIdx);
      if (executingPlanStepIdx === undefined) {
        setExecutingPlanStepIdx(0);
        executePlanStep(0, !shouldKeepGoing);
      } else {
        executePlanStep(executingPlanStepIdx, !shouldKeepGoing);
      }
      // TODO - Execute requests from here for each step
      return;
    }

    // TODO - do something with awaiting input...

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

    // if (workflowState === "awaitingInput") {
    //   console.log("BOOTS: Updating plan step with input?", executingPlanStepIdx);
    //   // TODO - Implement this
    //   return;
    // }

    try {
      // const { commands } =
      //   await translateCommandsMutation.mutateAsync(replacedPrompt);
      // setTranslatedCommands(commands);

      // NOTE - { plan, description } is the format we expect from the API
      const planResponse = await createPlanMutation.mutateAsync(
        replacedPrompt,
        promptMessages,
      );
      setPlan({
        steps: planResponse?.plan,
        description: planResponse?.description,
      });

      addPromptMessage({ role: "user", content: replacedPrompt });

      // Start executing the pipeline
    } catch (error) {
      console.error("Failed to translate commands:", error);
    }
  };

  const handleReset = () => {
    setPromptText("");
    setWorkflowState("idle");
    setShouldKeepGoing(false);
    clearPlan();
    setPromptMessages([]);
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
      <div className="max-w-lg w-full min-h-[400px] bg-background border rounded-lg shadow-lg overflow-hidden grid grid-rows-[auto,1fr,auto] pointer-events-auto">
        <PromptPanelHeader onReset={handleReset} />
        <div className="overflow-y-auto relative">
          <PromptPanelContent
            promptValue={promptText}
            handlePromptChange={handlePromptChange}
            handlePromptSubmit={handlePromptSubmit}
            executeNextStep={executeNextStep}
            executeEntirePlan={executeEntirePlan}
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
  allRoutes,
  promptValue,
  handlePromptChange,
  handlePromptSubmit,
  executeNextStep,
  executeEntirePlan,
  routeCompletions,
}: {
  allRoutes: ProbedRoute[];
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  executeNextStep: () => void;
  executeEntirePlan: () => void;
  routeCompletions: Completion[];
}) {
  const { getRoutesInPlan } = useRequestorStore("getRoutesInPlan");

  // this is the derived state of the routes that are currently in action from the prompt input (in the order they are in the prompt)
  const routesInPlan = getRoutesInPlan(allRoutes);

  return (
    <div className="grid gap-4 pb-4 content-start">
      <PromptInput
        promptValue={promptValue}
        handlePromptChange={handlePromptChange}
        handlePromptSubmit={handlePromptSubmit}
        executeNextStep={executeNextStep}
        executeEntirePlan={executeEntirePlan}
        allRoutes={allRoutes}
        routeCompletions={routeCompletions}
        isCompact={!!routesInPlan}
      />
      {routesInPlan && <ActiveCommandsList routesInPlan={routesInPlan} />}
    </div>
  );
}

function ActiveCommandsList({
  routesInPlan,
}: {
  routesInPlan: ProbedRoute[];
}) {
  const { executingPlanStepIdx } = useRequestorStore("executingPlanStepIdx");

  const { history } = useRequestorHistory();
  const previousResponses = history.slice(0, executingPlanStepIdx);

  return (
    <div className="px-4 overflow-y-auto">
      <Separator decorative={true} className="my-2 dashed" />
      <div className="grid grid-cols-1 gap-1">
        {routesInPlan.map((route, index) => (
          <ActiveCommand
            key={`${route.id}-${index}`}
            index={index}
            route={route}
            isActive={index === executingPlanStepIdx}
            previousResponses={previousResponses}
          />
        ))}
      </div>
    </div>
  );
}

function ActiveCommand({
  route,
  // previousResponses,
  index,
  isActive,
}: {
  route: ProbedRoute;
  isActive: boolean;
  previousResponses: ProxiedRequestResponse[];
  index: number;
}) {
  const {
    activePlanStepIdx,
    setActiveRouteById,
    body,
    path: currentPath,
    // method,
    //
    // NOTE - WE determine matching middleware on the backend now, do not need this! SO don't implement it
    // getMatchingMiddleware,
    pathParams,
    queryParams,
    updateMethod,
    updatePath,
    requestHeaders,
    plan,
    setActivePlanStepIdx,
    setBody,
    // setPathParams,
    // updatePathParamValues,
    setQueryParams,
    setRequestHeaders,
    updatePlanStep,
    // workflowState,
    getPlanStepProgress,
    getPlanStepResponse,
  } = useRequestorStore(
    "activePlanStepIdx",
    "setActiveRouteById",
    "path",
    "method",
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
    "getPlanStepProgress",
    "getPlanStepResponse",
  );

  const progress = getPlanStepProgress(index);
  const navigate = useNavigate();

  // If the user is inspecting the current step, highlight it
  const isInspecting = activePlanStepIdx === index;

  const response = getPlanStepResponse(index);
  // console.log("BOOTS: step index, response", index, response);

  // Determine the to prop based on response and route state
  const requestHistoryRoute = `/request/${response?.traceId}?filter-tab=requests`;
  const routeRoute = `/route/${route.id}?filter-tab=routes`;
  const to = response?.traceId ? requestHistoryRoute : routeRoute;

  // if (progress !== "idle") {
  //   console.log("plan step index,progress", index, progress);
  // }

  return (
    <Link
      // TODO - comment this out for now, since it might race condition
      to={to}
      onClick={(e) => {
        // HACK - Since we are overriding `onClick`
        //        we need to call preventDefault to prevent a route transition
        //        because otherwise it will reset the page
        e.preventDefault();
        e.stopPropagation();
        console.log("BOOTS: Navigating to", to);

        if (activePlanStepIdx === index) {
          return;
        }

        // NOTE: kinda jank but kinda cool way to reuse the request data editor
        // UI for updating the workflow plans
        if (activePlanStepIdx) {
          updatePlanStep(activePlanStepIdx, {
            payload: {
              path: currentPath,
              body: body.value,
              // HACK - Always json
              bodyType: {
                type: body.type,
                isMultipart: false,
              },
              pathParameters: pathParams,
              queryParameters: queryParams,
              headers: requestHeaders,
            },
          });
        }
        const selectedStep = plan?.steps?.[index];
        console.log("BOOTS: Selected step", selectedStep);
        if (selectedStep) {
          setActiveRouteById(selectedStep.route.id);
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

          // NOTE - might not even need this since we can just select the active route!!
          //
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
        const shouldIgnoreRecentResponse =
          progress !== "success" && progress !== "error";
        if (shouldIgnoreRecentResponse) {
          navigate(
            `${routeRoute}&ignore-recent-response=${shouldIgnoreRecentResponse}`,
          );
        } else {
          // TODO this probably does not work
          navigate(to);
        }
        // navigate(to);
        // console.log("BOOTS: Navigating to", to);
      }}
      className={cn(
        "grid grid-cols-[auto,1fr] gap-2 items-center rounded-lg px-3 py-1",
        "text-sm font-medium font-mono text-gray-400",
        isInspecting && "border-primary border",
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
      {progress === "warning" && (
        <Icon
          icon="lucide:alert-circle"
          className={cn("h-4 w-4 text-yellow-500", isActive && "animate-pulse")}
        />
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
  executeNextStep,
  executeEntirePlan,
  allRoutes,
  routeCompletions,
  isCompact,
}: {
  promptValue: string;
  handlePromptChange: (value?: string) => void;
  handlePromptSubmit: () => Promise<void>;
  executeNextStep: () => void;
  executeEntirePlan: () => void;
  allRoutes: ProbedRoute[];
  routeCompletions: Completion[];
  isCompact: boolean;
}) {
  const { plan, workflowState, executingPlanStepIdx, awaitingInputMessage } =
    useRequestorStore(
      "plan",
      "workflowState",
      "executingPlanStepIdx",
      "awaitingInputMessage",
    );
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

      {!!plan && (
        <div className="flex items-center">
          <WorkflowStateMessage
            workflowState={workflowState}
            executingPlanStepIdx={executingPlanStepIdx}
            awaitingInputMessage={awaitingInputMessage}
          />
          <div className="flex items-center gap-1 flex-grow justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={executeNextStep}
                >
                  <Icon icon="lucide:arrow-down-to-dot" className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Execute next plan step</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={executeEntirePlan}
                >
                  <Icon icon="lucide:circle-play" className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Execute entire plan</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowStateMessage({
  workflowState,
  executingPlanStepIdx,
  awaitingInputMessage,
}: {
  workflowState: PromptWorkflowState;
  executingPlanStepIdx: number | undefined;
  awaitingInputMessage: string | undefined;
}) {
  const { getPlanStepProgress } = useRequestorStore("getPlanStepProgress");
  let content: null | React.ReactNode = null;
  if (workflowState !== "idle" && workflowState !== "completed") {
    const progress = getPlanStepProgress(executingPlanStepIdx ?? 0);
    content = (
      <>
        {workflowState}: step {(executingPlanStepIdx ?? 0) + 1}
        {"—"}
        {progress}
      </>
    );
  }
  if (workflowState === "completed") {
    content = "plan completed";
  }
  if (workflowState === "idle") {
    content = (
      <span className="text-yellow-200/80">
        review plan then click a button over there ➡️
      </span>
    );
  }
  if (workflowState === "awaitingInput") {
    content = (
      <div className="text-yellow-200/80">
        <span className="animate-ping">Confirm continue</span> - you can edit
        the request or add instructions {awaitingInputMessage}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "text-sm text-muted-foreground italic",
        workflowState === "executing" && "animate-pulse",
        workflowState === "completed" && "animate-in text-green-500",
      )}
    >
      {content}
    </div>
  );
}