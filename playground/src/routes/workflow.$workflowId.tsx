import { CodeMirrorInput } from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/lib/workflowStore";
import type { Parameter, WorkflowStep } from "@/types";
import type { ExecuteStepResult } from "@/lib/hooks/useWorkflows";
import { validate } from "@scalar/openapi-parser";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useRouteContext,
  useSearch,
} from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";
import { Method } from "@/components/Method";
import type {
  OpenAPIOperation,
  OpenApiPathItem,
  OpenApiSpec,
} from "@fiberplane/fpx-types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useExecuteStep } from "@/lib/hooks/useWorkflows";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { openapi } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate({ from: Route.fullPath });
  const { stepId } = useSearch({ from: Route.fullPath });

  const { setInputValue, inputValues } = useWorkflowStore();
  const selectedStep = workflow.steps.find((step) => step.stepId === stepId);

  const { data: validatedOpenApi } = useQuery({
    queryKey: ["openapi", openapi?.content],
    queryFn: async () => {
      if (!openapi?.content) {
        return null;
      }
      const { valid, schema } = await validate(openapi.content);
      if (!valid) {
        throw new Error("Invalid OpenAPI spec");
      }
      return schema as OpenApiSpec;
    },
    enabled: !!openapi?.content,
  });

  // Helper function to get operation details from OpenAPI spec
  const getOperationDetails = (operationString: string) => {
    if (!validatedOpenApi?.paths) {
      return null;
    }

    const [method, path] = operationString.split(" ");
    if (!method || !path) {
      return null;
    }

    const pathObj = validatedOpenApi.paths[path] as OpenApiPathItem;
    if (!pathObj) {
      return null;
    }

    const operation = pathObj[method.toLowerCase()] as OpenAPIOperation;
    if (!operation) {
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

  if (!openapi) {
    console.error("No OpenAPI spec found");
  }

  return (
    <div
      className={cn(
        "grid h-full gap-4",
        selectedStep ? "grid-cols-2" : "grid-cols-1",
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
                className="grid gap-4 max-w-[800px]"
                renderItem={([key, schema]) => (
                  <div key={key} className="grid gap-1 lg:grid-cols-2">
                    <div>
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
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium">Steps</h3>
            <div className="grid gap-4">
              {workflow.steps.map((step, index) => (
                <StepCard
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
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedStep && (
        <StepDetails
          step={selectedStep}
          operationDetails={getOperationDetails(selectedStep.operation)}
        />
      )}
    </div>
  );
}

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
  const { openapi } = useRouteContext({ from: "__root__" });
  const { data: validatedOpenApi } = useQuery({
    queryKey: ["openapi", openapi?.content],
    queryFn: async () => {
      if (!openapi?.content) {
        return null;
      }
      const { valid, schema } = await validate(openapi.content);
      if (!valid) {
        throw new Error("Invalid OpenAPI spec");
      }
      return schema as OpenApiSpec;
    },
    enabled: !!openapi?.content,
  });

  const addServiceUrlIfBarePath = (path: string) => {
    // OpenAPI 3.0 type includes servers, but the type definition is incomplete
    interface OpenApiWithServers extends OpenApiSpec {
      servers?: Array<{ url: string }>;
    }
    const baseUrl = (validatedOpenApi as OpenApiWithServers)?.servers?.[0]?.url;
    if (!baseUrl) {
      return path;
    }
    return new URL(path, baseUrl).toString();
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
              setOutputValue(output.key, resolvedValue);
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
  const errorMessage =
    executeStep.error instanceof Error
      ? executeStep.error.message
      : typeof executeStep.error === "object" &&
          executeStep.error &&
          "message" in executeStep.error
        ? String(executeStep.error.message)
        : "An unknown error occurred";

  const hasUnresolvedParams = step.parameters.some((param) => {
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  const unresolvedParams = step.parameters.filter((param) => {
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  return (
    <div className="h-full p-4 overflow-auto border rounded-md">
      <div className="grid items-center justify-between mb-6">
        <div className="grid gap-1">
          <h2 className="text-2xl font-medium">{step.description}</h2>
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <div className="grid gap-4">
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
            <div className="mt-6 space-y-4">
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

                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setResponseView(
                        responseView === "body" ? "headers" : "body",
                      )
                    }
                  >
                    View {responseView === "body" ? "Headers" : "Body"}
                  </Button>
                )}
              </div>

              {/* Execution status */}
              {(result || executeStep.error || isLoading) && (
                <div className="p-4 rounded-md bg-muted">
                  <div className="flex items-center gap-3 mb-3">
                    <StatusBadge
                      status={
                        isLoading
                          ? "pending"
                          : executeStep.error
                            ? "error"
                            : "success"
                      }
                    />
                  </div>

                  {/* Error display */}
                  {executeStep.error && (
                    <div className="p-3 rounded-md bg-destructive/10">
                      <pre className="text-sm text-destructive">
                        {errorMessage}
                      </pre>
                    </div>
                  )}

                  {/* Response data */}
                  {(result || stepState) && (
                    <div className="overflow-x-auto">
                      <pre className="p-3 text-sm rounded-md bg-background">
                        {responseView === "body"
                          ? String(
                              JSON.stringify(
                                (stepState as ExecuteStepResult)?.data ?? result?.data,
                                null,
                                2,
                              ),
                            )
                          : String(
                              JSON.stringify(
                                (stepState as ExecuteStepResult)?.headers ?? result?.headers ?? {},
                                null,
                                2,
                              ),
                            )}
                      </pre>
                    </div>
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
                  items={step.outputs}
                  renderItem={(output) => (
                    <OutputItem key={output.key} output={output} />
                  )}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ExecutionStatus = "pending" | "success" | "error";

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const statusConfig = {
    pending: { color: "bg-blue-100 text-blue-800", label: "Running" },
    success: { color: "bg-green-100 text-green-800", label: "Success" },
    error: { color: "bg-red-100 text-red-800", label: "Failed" },
  }[status];

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
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
          <div>
            <p className="mb-1 text-sm font-medium">Operation</p>
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
              <p className="mt-2 text-sm text-muted-foreground">
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
                items={step.outputs}
                renderItem={(output) => (
                  <OutputItem key={output.key} output={output} />
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

function OutputItem({ output }: { output: { key: string; value: string } }) {
  return (
    <p className="font-mono text-sm text-muted-foreground">
      {output.key}: {output.value}
    </p>
  );
}
