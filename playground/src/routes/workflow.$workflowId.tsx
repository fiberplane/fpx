import { CodeMirrorInput } from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { Method } from "@/components/Method";
import { Button } from "@/components/ui/button";
import type { OpenAPI } from "openapi-types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CustomTabTrigger,
  CustomTabsContent,
  CustomTabsList,
} from "@/garbage/RequestorPage/Tabs";
import { useOpenApiParse } from "@/lib/hooks/useOpenApiParse";
import { useOpenApiSpec } from "@/lib/hooks/useOpenApiSpec";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { ExecuteStepResult } from "@/lib/hooks/useWorkflows";
import { useExecuteStep } from "@/lib/hooks/useWorkflows";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/lib/workflowStore";
import type { Parameter, WorkflowStep } from "@/types";
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouteContext,
  useSearch,
} from "@tanstack/react-router";
import { ChevronDown, Link as LinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { isOpenApiV2, isOpenApiV3x } from "../lib/isOpenApiV2";

type OpenAPIOperation = OpenAPI.Operation;
export const Route = createFileRoute("/workflow/$workflowId")({
  validateSearch: z.object({
    stepId: z.string().optional(),
  }),
  component: WorkflowDetail,
  loader: async ({ context: { queryClient }, params: { workflowId } }) => {
    const response = await queryClient.ensureQueryData(
      workflowQueryOptions(workflowId),
    );

    return { workflow: response.data };
  },
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();
  const content = useRouteContext({
    from: "__root__",
    select: (context) => {
      console.log("context", context);
      return context.openapi?.content;
    },
  });
  console.log("useRouteContext", content);
  // const { openapi } = context;
  const openapi = useRouteContext({
    from: "__root__",
    select: (context) => context.openapi,
  });
  const navigate = useNavigate({ from: Route.fullPath });
  const { stepId } = useSearch({ from: Route.fullPath });

  const { setInputValue, inputValues } = useWorkflowStore();
  const selectedStep =
    workflow.steps.find((step) => step.stepId === stepId) || workflow.steps[0];

  const { data: spec, error: loadingError } = useOpenApiSpec(openapi);
  const { data: validatedOpenApi, error: parsingError } = useOpenApiParse(spec);

  const getOperationDetails = (operationString: string) => {
    if (!validatedOpenApi) {
      return null;
    }

    if (!validatedOpenApi?.paths) {
      return null;
    }

    const [method, path] = operationString.split(" ");

    const pathObj = validatedOpenApi.paths[path];
    if (!pathObj) {
      return null;
    }

    type PathObjKeys = keyof typeof pathObj;

    // Assume that method results in a valid key
    // Also assume that the keys we care about are all lowercase
    const lowerCaseMethod = method.toLowerCase() as PathObjKeys;

    // Ignore non-methods properties
    const ignore = ["summary", "$ref", "description", "servers"] as const;
    if (lowerCaseMethod in ignore) {
      return null;
    }

    const operation = pathObj[lowerCaseMethod];
    if (!operation || typeof operation === "string") {
      return null;
    }

    if (Array.isArray(operation)) {
      // TODO handle array of operations
      return null;
    }

    return {
      method,
      path,
      operation,
    };
  };

  const handleInputChange = (key: string, value?: string) => {
    setInputValue(key, value || "");
  };

  if (loadingError || parsingError) {
    return (
      <div className="grid place-items-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-medium">Error loading OpenAPI spec</h2>
          <p className="text-sm text-muted-foreground">
            {loadingError?.message || parsingError?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full gap-4",
        selectedStep ? "grid-cols-3" : "grid-cols-1",
      )}
    >
      <div className="h-full p-4 overflow-auto border rounded-md">
        <div className="grid items-center justify-between mb-6">
          <div className="grid gap-1">
            <h2 className="text-2xl font-medium">{workflow.summary}</h2>
            {workflow.description && (
              <p className="text-sm text-foreground">{workflow.description}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <h3 className="mb-4 text-lg font-medium">Inputs</h3>
            {workflow.inputs.properties && (
              <CollapsibleList
                items={Object.entries(workflow.inputs.properties)}
                maxItems={5}
                className="grid gap-2 max-w-[800px]"
                renderItem={([key, schema]) => (
                  <div key={key} className="grid gap-1 lg:grid-cols-2">
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {schema.title || key}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({schema.type})
                        </span>
                        {workflow.inputs.required?.includes(key) && (
                          <span className="text-xs text-destructive">
                            *required
                          </span>
                        )}
                      </div>
                      {schema.description && (
                        <p className="text-sm text-muted-foreground">
                          {schema.description}
                        </p>
                      )}
                      {schema.examples && schema.examples.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Example: {JSON.stringify(schema.examples[0])}
                        </p>
                      )}
                    </div>

                    <div>
                      <CodeMirrorInput
                        value={inputValues[key] || ""}
                        onChange={(value) => handleInputChange(key, value)}
                        placeholder={
                          schema.examples?.[0]?.toString() ||
                          `Enter ${schema.type}`
                        }
                        className="mt-1 bg-muted"
                      />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
              Steps{" "}
              <div className="font-normal text-sm text-muted-foreground">
                {workflow.steps.length} total
              </div>
            </h3>
            <div className="grid gap-4">
              {workflow.steps.map((step, index) => (
                <div key={step.stepId}>
                  <StepperItem
                    index={index}
                    stepId={step.stepId}
                    operation={step.operation}
                    description={step.description}
                    selected={selectedStep.stepId === step.stepId}
                  />
                  {/* <StepCard
                    key={step.stepId}
                    step={step}
                    index={index}
                    isSelected={step.stepId === stepId}
                    onSelect={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          stepId:
                            step.stepId === stepId ? undefined : step.stepId,
                        }),
                      })
                    }
                    operationDetails={getOperationDetails(step.operation)}
                  /> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedStep && (
        <div className="col-span-2">
          <StepDetails
            step={selectedStep}
            operationDetails={getOperationDetails(selectedStep.operation)}
          />
        </div>
      )}
    </div>
  );
}

const StepperItem = (
  props: Pick<WorkflowStep, "stepId" | "operation" | "description"> & {
    index: number;
    selected?: boolean;
  },
) => {
  const { index, selected, stepId, description } = props;
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, stepId })}
      className={cn(
        `grid grid-cols-[auto_1fr] gap-4 rounded-md cursor-pointer relative before:content-[""] first:before:absolute before:h-full before:bottom-[16px] before:border-l before:border-l-foreground before:left-[12px] z-0`,
        index === 0 ? "before:hidden" : "before:block",
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center z-10 relative",
          selected ? "bg-primary" : "bg-accent-foreground",
        )}
      >
        <span className="text-primary-foreground">{index + 1}</span>
      </div>
      <div>{description}</div>
    </Link>
  );
};

interface StepDetailsProps {
  step: WorkflowStep;
  operationDetails: {
    method: string;
    path: string;
    operation: OpenAPIOperation;
  } | null;
}

function StepDetails({ step, operationDetails }: StepDetailsProps) {
  const {
    workflowState,
    resolveRuntimeExpression,
    setStepResult,
    setOutputValue,
  } = useWorkflowStore();
  const [responseView, setResponseView] = useState<"body" | "headers">("body");
  const executeStep = useExecuteStep();

  const openapi = useRouteContext({
    from: "__root__",
    select: (context) => context.openapi,
  });
  const { data: spec } = useOpenApiSpec(openapi);
  const { data: validatedOpenApi } = useOpenApiParse(spec);

  const addServiceUrlIfBarePath = (path: string) => {
    console.log("addServiceUrlIfBarePath", path);
    if (!validatedOpenApi) {
      return path;
    }

    if (isOpenApiV2(validatedOpenApi) && validatedOpenApi.host) {
      return new URL(path, validatedOpenApi.host).toString();
    }

    if (
      isOpenApiV3x(validatedOpenApi) &&
      validatedOpenApi.servers &&
      validatedOpenApi.servers?.length > 0
    ) {
      const baseUrl = validatedOpenApi.servers[0].url;
      return new URL(path, baseUrl).toString();
    }

    return path;
  };

  const handleExecute = () => {
    const [method, path] = step.operation.split(" ");
    if (!method || !path) {
      return;
    }

    // Check if all parameters have resolved values
    const unresolvedParams = step.parameters.filter((param) => {
      const value = resolveRuntimeExpression(param.value);
      return value === param.value && param.value.startsWith("$");
    });

    if (unresolvedParams.length > 0) {
      // Don't execute if there are unresolved params
      return;
    }

    // Process parameters into query params and body
    const queryParams = new URLSearchParams();
    const body: Record<string, unknown> = {};
    let processedPath = path;

    for (const param of step.parameters) {
      const value = resolveRuntimeExpression(param.value);

      if (path.includes(`{${param.name}}`)) {
        processedPath = processedPath.replace(
          `{${param.name}}`,
          encodeURIComponent(String(value)),
        );
      } else if (method === "GET" || method === "DELETE") {
        queryParams.append(param.name, String(value));
      } else {
        body[param.name] = value;
      }
    }

    // Add query string if any params
    const queryString = queryParams.toString();
    if (queryString) {
      processedPath += (processedPath.includes("?") ? "&" : "?") + queryString;
    }

    // Add base URL
    const url = addServiceUrlIfBarePath(processedPath);

    executeStep.mutate(
      {
        stepId: step.stepId,
        url,
        method,
        body: Object.keys(body).length > 0 ? body : undefined,
      },
      {
        onSuccess: (result) => {
          // First store the step result
          setStepResult(step.stepId, result);

          // Then resolve outputs in next tick to ensure state is updated
          queueMicrotask(() => {
            for (const output of step.outputs) {
              const resolvedValue = resolveRuntimeExpression(output.value);
              console.log("updating output value", output.key, resolvedValue);
              setOutputValue(
                `$steps.${step.stepId}.outputs.${output.key}`,
                resolvedValue,
              );
            }
          });
        },
      },
    );
  };

  const stepState = workflowState[step.stepId];
  const result =
    executeStep.data?.stepId === step.stepId ? executeStep.data : undefined;
  const isLoading =
    executeStep.isPending && executeStep.variables?.stepId === step.stepId;

  const stepError = executeStep.error;
  const errorMessage =
    stepError === null
      ? null
      : stepError instanceof Error
        ? stepError.message
        : "An unknown error occurred";

  const hasUnresolvedParams = step.parameters.some((param) => {
    console.log("i can haz unresolved?", param.value);
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  const unresolvedParams = step.parameters.filter((param) => {
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  console.log("stepId", step.stepId);
  return (
    <div className="h-full p-4 overflow-y-auto overflow-x-hidden border rounded-md ">
      <div className="max-w-[800px]">
        <div className="grid items-center justify-between mb-6">
          <div className="grid gap-1">
            <h2 className="text-2xl font-medium">{step.description}</h2>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <div className="grid gap-4">
              <div className="flex justify-between gap-2 mx-1.5">
                <div>
                  <p className="mb-1 text-sm font-medium">Operation</p>
                  <div className="flex items-end gap-2 font-mono text-sm">
                    <Method
                      method={
                        operationDetails?.method || step.operation.split(" ")[0]
                      }
                    />
                    <span className="text-muted-foreground">
                      {operationDetails?.path || step.operation.split(" ")[1]}
                    </span>
                  </div>
                  {operationDetails?.operation?.summary && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {operationDetails.operation.summary}
                    </p>
                  )}
                </div>

                {/* Execution controls */}
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={(e) => {
                          if (hasUnresolvedParams) {
                            e.preventDefault();
                            return;
                          }
                          handleExecute();
                        }}
                        disabled={isLoading}
                      >
                        {result ? "Re-run Step" : "Execute Step"}
                      </Button>
                    </TooltipTrigger>
                    {hasUnresolvedParams && (
                      <TooltipContent>
                        <p>Cannot execute: Unresolved values for parameters:</p>
                        <ul className="mt-2 list-disc list-inside">
                          {unresolvedParams.map((param) => (
                            <li key={param.name} className="text-sm">
                              {param.name}: {param.value}
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {(result || executeStep.error || isLoading) && (
                  <div className="py-1.5 rounded-md bg-muted">
                    {errorMessage && (
                      <div className="p-3 rounded-md bg-destructive/10">
                        <pre className="text-sm text-destructive">
                          {String(errorMessage)}
                        </pre>
                      </div>
                    )}

                    {(!!result || !!stepState) && (
                      <Tabs
                        value={responseView}
                        onValueChange={(value) =>
                          setResponseView(value as "body" | "headers")
                        }
                        className="grid grid-rows-[auto_1fr] overflow-hidden h-full"
                      >
                        {" "}
                        <div className="flex items-center gap-3 mb-3 mx-2 justify-between">
                          <div className="text-sm font-medium">Response</div>
                          <StatusBadge
                            status={
                              isLoading
                                ? "pending"
                                : executeStep.error
                                  ? "error"
                                  : "success"
                            }
                            title={
                              result?.status
                                ? `Status code: ${result?.status}`
                                : undefined
                            }
                          />
                        </div>
                        <CustomTabsList className="mx-2">
                          <CustomTabTrigger
                            key="body"
                            value="body"
                            className="flex items-center"
                          >
                            Body
                          </CustomTabTrigger>
                          <CustomTabTrigger
                            key="headers"
                            value="headers"
                            className="flex items-center"
                          >
                            Headers
                          </CustomTabTrigger>
                        </CustomTabsList>
                        <CustomTabsContent value="headers" className="h-full">
                          <div className="overflow-x-auto">
                            <pre className="p-3 text-sm rounded-md bg-background">
                              {String(
                                JSON.stringify(
                                  (stepState as ExecuteStepResult)?.headers ??
                                  result?.headers ??
                                  {},
                                  null,
                                  2,
                                ),
                              )}
                            </pre>
                          </div>
                        </CustomTabsContent>
                        <CustomTabsContent value="body" className="h-full">
                          <div className="overflow-x-auto">
                            <pre className="p-3 text-sm rounded-md bg-background">
                              {String(
                                JSON.stringify(
                                  (stepState as ExecuteStepResult)?.data ??
                                  result?.data,
                                  null,
                                  2,
                                ),
                              )}
                            </pre>
                          </div>
                        </CustomTabsContent>
                      </Tabs>
                    )}
                  </div>
                )}
              </div>

              {step.parameters.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium">Parameters</div>
                  <CollapsibleList
                    items={step.parameters}
                    renderItem={(param) => (
                      <ParameterItem key={param.name} param={param} />
                    )}
                  />
                </div>
              )}
              {step.outputs.length > 0 && (
                <>
                  <p className="mb-1 text-sm font-medium">Outputs</p>
                  <CollapsibleList
                    className="overflow-hidden"
                    items={step.outputs}
                    renderItem={(output) => (
                      <OutputItem
                        key={output.key}
                        stepId={step.stepId}
                        output={output}
                      />
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ExecutionStatus = "pending" | "success" | "error";

function StatusBadge({
  status,
  title,
}: { status: ExecutionStatus; title?: string }) {
  const statusConfig = {
    pending: { color: "bg-blue-100 text-blue-800", label: "Running" },
    success: { color: "bg-green-100 text-green-800", label: "Success" },
    error: { color: "bg-red-100 text-red-800", label: "Failed" },
  }[status];

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
      title={title}
    >
      {statusConfig.label}
    </span>
  );
}

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  operationDetails: {
    method: string;
    path: string;
    operation: OpenAPIOperation;
  } | null;
}

function StepCard({
  step,
  index,
  isSelected,
  onSelect,
  operationDetails,
}: StepCardProps) {
  return (
    <Card
      className={cn(
        "relative transition-colors shadow-none cursor-pointer group bg-card/50 hover:bg-card/70",
        isSelected && "ring-2 ring-primary",
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {index + 1}. {step.description}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Operation</p>
            <div className="flex items-center gap-2 font-mono text-sm">
              <Method
                method={
                  operationDetails?.method || step.operation.split(" ")[0]
                }
              />
              <span className="text-muted-foreground">
                {operationDetails?.path || step.operation.split(" ")[1]}
              </span>
            </div>
            {operationDetails?.operation?.summary && (
              <p className="text-sm text-muted-foreground">
                {operationDetails.operation.summary}
              </p>
            )}
          </div>
          {step.parameters.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium">Parameters</div>
              <CollapsibleList
                items={step.parameters}
                renderItem={(param) => (
                  <ParameterItem key={param.name} param={param} />
                )}
              />
            </div>
          )}
          {step.outputs.length > 0 && (
            <>
              <p className="mb-1 text-sm font-medium">Outputs</p>
              <CollapsibleList
                className="max-w-full overflow-hidden"
                items={step.outputs}
                renderItem={(output) => (
                  <OutputItem
                    key={output.key}
                    stepId={step.stepId}
                    output={output}
                  />
                )}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CollapsibleListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  maxItems?: number;
  className?: string;
}

function CollapsibleList<T>({
  items,
  renderItem,
  maxItems = 3,
  className,
}: CollapsibleListProps<T>) {
  if (items.length <= maxItems) {
    return (
      <div className={cn("grid gap-2", className)}>{items.map(renderItem)}</div>
    );
  }

  return (
    <Collapsible className={cn(className)}>
      <div className="grid gap-2">
        {items.slice(0, maxItems).map(renderItem)}
      </div>
      <CollapsibleContent>
        <div className="grid gap-2 mt-2">
          {items.slice(maxItems).map(renderItem)}
        </div>
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 mt-2 text-sm text-muted-foreground hover:text-foreground group"
        >
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          <span className="group-data-[state=closed]:hidden">Hide</span>
          <span className="group-data-[state=open]:hidden">
            Show {items.length - maxItems} More
          </span>
        </button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}

function ParameterItem({ param }: { param: Parameter }) {
  const { resolveRuntimeExpression } = useWorkflowStore();
  const resolvedValue = resolveRuntimeExpression(param.value);

  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="font-mono text-muted-foreground">{param.name}:</div>
      <div className="text-muted-foreground">
        <span>{String(resolvedValue)}</span>
        {resolvedValue !== param.value && (
          <span className="ml-2 text-xs text-muted-foreground">
            ({param.value})
          </span>
        )}
      </div>
    </div>
  );
}

const NOT_FOUND = Symbol("NOT_FOUND");
function OutputItem({
  output,
  stepId,
}: { output: { key: string; value: string }; stepId?: string }) {
  const fullStepId = stepId
    ? `$steps.${stepId}.outputs.${output.key}`
    : output.key;
  console.log("fullStepID", fullStepId);
  const value = useWorkflowStore(
    useShallow((state) =>
      fullStepId in state.outputValues
        ? state.outputValues[fullStepId]
        : NOT_FOUND,
    ),
  );
  return (
    <p className="text-sm grid grid-cols-[200px_auto] max-w-full overflow-hidden">
      <div>{output.key}:</div>

      <div className="overflow-x-auto">
        {value === NOT_FOUND ? (
          output.value
        ) : (
          <>
            <pre className="font-mono bg-background overflow-auto max-w-full">
              <code>
                {JSON.stringify(output.value, null, "\t").replaceAll(
                  '],\n\t"',
                  '],\n\n\t"',
                )}
              </code>
            </pre>
            <div className="text-sm font-sans">(based on: {output.value})</div>
          </>
        )}
      </div>
    </p>
  );
}
