import {
  CodeMirrorInput,
  codeMirrorClassNames,
} from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { Method } from "@/components/Method";
import { Button } from "@/components/ui/button";
import type { OpenAPI } from "openapi-types";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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
import type { JSONPropertyValueSchema, Parameter, WorkflowStep } from "@/types";
import {
  Link,
  createFileRoute,
  // useNavigate,
  useRouteContext,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowDownToDot,
  ChevronDown,
  Edit,
  Play,
  StepBack,
  StepForward,
  // Link as LinkIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { isOpenApiV2, isOpenApiV3x } from "../lib/isOpenApiV2";
import { useShake } from "@/hooks";

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
  const openapi = useRouteContext({
    from: "__root__",
    select: (context) => context.openapi,
  });
  // const navigate = useNavigate({ from: Route.fullPath });
  const { stepId } = useSearch({ from: Route.fullPath });

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

  const stepIndex = workflow.steps.findIndex(
    (step) => step.stepId === selectedStep.stepId,
  );

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
          {/* <div>
            <h3 className="mb-4 text-lg font-medium">Inputs</h3> */}
          <ListSection title="Inputs">
            {workflow.inputs.properties && (
              <CollapsibleList
                items={Object.entries(workflow.inputs.properties)}
                maxItems={5}
                className="grid gap-2 max-w-[800px]"
                renderItem={([key, schema]) => (
                  <InputItem
                    key={key}
                    propertyKey={key}
                    schema={schema}
                    value={""}
                  />
                )}
              />
            )}
          </ListSection>
          <ListSection
            title={
              <div className="grid gap-2 items-center grid-cols-[1fr_auto]">
                <h3 className="text-lg font-medium flex items-center gap-2 justify-between">
                  Steps
                  <div className="font-normal text-sm text-muted-foreground flex items-center">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="w-auto px-1 py-1 hover:text-muted rounded-sm gap-0"
                    >
                      <Play />
                      Run {workflow.steps.length} steps
                    </Button>
                  </div>
                </h3>
              </div>
            }
          >
            <div className="grid gap-1">
              <div className="grid gap-2">
                {workflow.steps.map((step, index) => (
                  <div key={step.stepId}>
                    <StepperItem
                      index={index}
                      stepId={step.stepId}
                      operation={step.operation}
                      description={step.description}
                      selected={selectedStep.stepId === step.stepId}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center h-fit text-muted-foreground justify-center border-t border-t-muted pt-2">
                Go to
                <Link
                  to="."
                  className={cn(
                    "flex items-center gap-1 text-sm text-muted-foreground  p-1 rounded-sm",
                    stepIndex === 0 || stepIndex === -1
                      ? "pointer-events-none"
                      : "pointer-events-auto bg-secondary text-secondary-foreground hover:bg-primary",
                  )}
                  title="previous"
                  search={
                    stepIndex === 0 || stepIndex === -1
                      ? (prev) => ({
                        ...prev,
                        stepId: workflow.steps[stepIndex - 1]?.stepId,
                      })
                      : undefined
                  }
                >
                  <StepBack className="w-4 h-4" />
                </Link>
                <Link
                  to="."
                  className={cn(
                    "flex items-center gap-1 text-sm text-muted-foreground  p-1 rounded-sm",
                    stepIndex < workflow.steps.length - 1 && stepIndex !== -1
                      ? "pointer-events-auto bg-secondary text-secondary-foreground hover:bg-primary p-1 rounded-sm"
                      : "pointer-events-none",
                  )}
                  title="next"
                  search={
                    stepIndex < workflow.steps.length - 1 && stepIndex !== -1
                      ? (prev) => ({
                        ...prev,
                        stepId: workflow.steps[stepIndex + 1]?.stepId,
                      })
                      : undefined
                  }
                >
                  <StepForward className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </ListSection>
        </div>
      </div>

      {selectedStep && (
        <div className="col-span-2 overflow-y-auto">
          <StepDetails
            step={selectedStep}
            operationDetails={getOperationDetails(selectedStep.operation)}
            nextStepId={
              stepIndex < workflow.steps.length - 1
                ? workflow.steps[stepIndex + 1].stepId
                : undefined
            }
            previousStepId={
              stepIndex > 0 ? workflow.steps[stepIndex - 1].stepId : undefined
            }
          />
        </div>
      )}
    </div>
  );

  function InputItem({
    propertyKey,
    schema,
  }: {
    propertyKey: string;
    value: string;
    schema: JSONPropertyValueSchema;
  }): ReactNode {
    const { setInputValue, inputValues } = useWorkflowStore();
    const value = inputValues[propertyKey] || "";

    return (
      <div key={propertyKey} className="grid gap-1 lg:grid-cols-2 items-center">
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {schema.title || propertyKey}
            </span>
            <span className="text-xs text-muted-foreground">
              ({schema.type})
            </span>
            {workflow.inputs.required?.includes(propertyKey) && (
              <span className="text-xs text-destructive">*required</span>
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
          {/* {schema.type === "boolean" && } */}
          {/* <CodeMirrorInput
          value={value || ""}
          onChange={ }
          placeholder={schema.examples?.[0]?.toString() ||
            `Enter ${schema.type}`}
          className="mt-1 bg-muted" /> */}
          {getInput(propertyKey, value, schema, setInputValue)}
        </div>
      </div>
    );
  }
}

function getInput(
  propertyKey: string,
  value: string,
  schema: JSONPropertyValueSchema,
  setInputValue: (key: string, value: string) => void,
): ReactNode {
  switch (schema.type) {
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(event) =>
            setInputValue(propertyKey, event.target.checked ? "true" : "false")
          }
          name={schema.title}
        // onChange={(e) => handleInputChange(schema.title, e.target.checked)}
        />
      );
    case "integer":
      return (
        <Input
          type="number"
          className={cn(codeMirrorClassNames, "bg-muted", "px-2")}
          placeholder="Enter an integer"
          value={value}
          onChange={(e) => setInputValue(propertyKey, e.target.value)}
          name={schema.title}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          className={cn(codeMirrorClassNames, "bg-muted")}
          value={value}
          onChange={(e) => setInputValue(propertyKey, e.target.value)}
          name={schema.title}
        />
      );
  }

  return (
    <CodeMirrorInput
      value={value || ""}
      onChange={(value) => setInputValue(propertyKey, value || "")}
      placeholder={schema.examples?.[0]?.toString() || `Enter ${schema.type}`}
      className="mt-1 bg-muted"
    />
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
        `grid grid-cols-[auto_1fr] gap-4 rounded-md cursor-pointer relative before:content-[""] first:before:absolute before:h-full before:bottom-[16px] before:border-l before:border-l-foreground before:left-[20px] z-0 py-2 px-2`,
        index === 0 ? "before:hidden" : "before:block",
        selected ? "bg-primary/10" : "hover:bg-muted",
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
  nextStepId?: string;
  previousStepId?: string;
  operationDetails: {
    method: string;
    path: string;
    operation: OpenAPIOperation;
  } | null;
}

function StepDetails({
  step,
  operationDetails,
  nextStepId,
  previousStepId,
}: StepDetailsProps) {
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
  const { shakeClassName, triggerShake } = useShake()

  const addServiceUrlIfBarePath = (path: string) => {
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
    const lowerCaseMethod = method?.toLowerCase();
    const body: Record<string, unknown> | undefined =
      lowerCaseMethod === "get" || lowerCaseMethod === "head"
        ? undefined
        : {};
    let processedPath = path;

    for (const param of step.parameters) {
      const value = resolveRuntimeExpression(param.value);

      if (path.includes(`{${param.name}}`)) {
        processedPath = processedPath.replace(
          `{${param.name}}`,
          encodeURIComponent(String(value)),
        );
      } else if (
        lowerCaseMethod === "get" ||
        // HACK - Delete could support a body - not sure why we default to putting query params here
        lowerCaseMethod === "delete" ||
        lowerCaseMethod === "head"
      ) {
        queryParams.append(param.name, String(value));
      } else {
        if (body) {
          body[param.name] = value;
        } else {
          console.debug(
            "Trying to add some body params to a GET or HEAD request ... skipping to avoid errors!!",
          );
        }
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
        body: body && Object.keys(body).length > 0 ? body : undefined,
      },
      {
        onSuccess: (result) => {
          // First store the step result
          setStepResult(step.stepId, result);

          // Then resolve outputs in next tick to ensure state is updated
          queueMicrotask(() => {
            for (const output of step.outputs) {
              const resolvedValue = resolveRuntimeExpression(output.value);
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
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  const unresolvedParams = step.parameters.filter((param) => {
    const value = resolveRuntimeExpression(param.value);
    return value === param.value && param.value.startsWith("$");
  });

  return (
    <div className="h-full p-4 overflow-y-auto overflow-x-hidden border rounded-md ">
      <div className="max-w-[800px]">
        <div className="grid items-center mb-6">
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <h2 className="text-2xl font-medium">{step.description}</h2>
            <div className="flex gap-2 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      if (hasUnresolvedParams) {
                        triggerShake()
                        e.preventDefault();
                        return;
                      }
                      handleExecute();
                    }}
                    size="sm"
                    className={cn("gap-1", shakeClassName)}
                    disabled={isLoading}
                  >
                    <ArrowDownToDot className="w-4 h-4" />
                    {result ? "Re-run Step" : "Run Step"}
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
              <Link
                to="."
                className={cn(
                  "flex items-center gap-1 text-sm text-muted-foreground  p-1 rounded-sm",
                  previousStepId
                    ? "pointer-events-auto bg-secondary text-secondary-foreground hover:bg-primary"
                    : "pointer-events-none",
                )}
                search={(prev) => ({
                  ...prev,
                  stepId: previousStepId,
                })}
              >
                <StepBack className="w-4 h-4" />
              </Link>
              <Link
                to="."
                className={cn(
                  "flex items-center gap-1 text-sm text-muted-foreground  p-1 rounded-sm",
                  nextStepId
                    ? "pointer-events-auto bg-secondary text-secondary-foreground hover:bg-primary"
                    : "pointer-events-none",
                )}
                search={(prev) => ({
                  ...prev,
                  stepId: nextStepId,
                })}
              >
                <StepForward className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 overflow-scroll">
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
            </div>
            {(result || executeStep.error || isLoading) && (
              <div className="mt-6 space-y-4">
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
                      className="grid grid-rows-[auto_1fr] overflow-hidden"
                    >
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
              </div>
            )}

            {step.parameters.length > 0 && (
              <ListSection title="Parameters">
                <CollapsibleList
                  items={step.parameters}
                  renderItem={(param) => (
                    <ParameterItem key={param.name} param={param} />
                  )}
                />
              </ListSection>
            )}
            {step.outputs.length > 0 && (
              <ListSection title="Outputs">
                <CollapsibleList
                  className="overflow-hidden mx-1"
                  items={step.outputs}
                  renderItem={(output) => (
                    <OutputItem
                      key={output.key}
                      stepId={step.stepId}
                      output={output}
                    />
                  )}
                />
              </ListSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListSection({
  title,
  children,
}: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="py-1.5 pb-2 rounded-lg bg-muted">
      <div className="grid items-center mx-2">
        <div className="p-1.5 pt-0.5 text-sm font-medium">{title}</div>
        <div className="bg-background rounded-md p-2 w-full">{children}</div>
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

// interface StepCardProps {
//   step: WorkflowStep;
//   index: number;
//   isSelected: boolean;
//   onSelect: () => void;
//   operationDetails: {
//     method: string;
//     path: string;
//     operation: OpenAPIOperation;
//   } | null;
// }

// function StepCard({
//   step,
//   index,
//   isSelected,
//   onSelect,
//   operationDetails,
// }: StepCardProps) {
//   return (
//     <Card
//       className={cn(
//         "relative transition-colors shadow-none cursor-pointer group bg-card/50 hover:bg-card/70",
//         isSelected && "ring-2 ring-primary",
//       )}
//       onClick={onSelect}
//     >
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-base font-medium">
//             {index + 1}. {step.description}
//           </CardTitle>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-4">
//           <div className="grid gap-1">
//             <p className="text-sm font-medium">Operation</p>
//             <div className="flex items-center gap-2 font-mono text-sm">
//               <Method
//                 method={
//                   operationDetails?.method || step.operation.split(" ")[0]
//                 }
//               />
//               <span className="text-muted-foreground">
//                 {operationDetails?.path || step.operation.split(" ")[1]}
//               </span>
//             </div>
//             {operationDetails?.operation?.summary && (
//               <p className="text-sm text-muted-foreground">
//                 {operationDetails.operation.summary}
//               </p>
//             )}
//           </div>
//           {step.parameters.length > 0 && (
//             <div>
//               <div className="mb-2 text-sm font-medium">Parameters</div>
//               <CollapsibleList
//                 items={step.parameters}
//                 renderItem={(param) => (
//                   <ParameterItem key={param.name} param={param} />
//                 )}
//               />
//             </div>
//           )}
//           {step.outputs.length > 0 && (
//             <>
//               <p className="mb-1 text-sm font-medium">Outputs</p>
//               <CollapsibleList
//                 className="max-w-full overflow-hidden"
//                 items={step.outputs}
//                 renderItem={(output) => (
//                   <OutputItem
//                     key={output.key}
//                     stepId={step.stepId}
//                     output={output}
//                   />
//                 )}
//               />
//             </>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

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
  const value = resolvedValue === param.value ? NOT_FOUND : resolvedValue;

  return (
    <div className="text-sm grid grid-cols-[200px_auto] max-w-full overflow-hidden">
      <div>{param.name}:</div>
      <div className="overflow-x-auto">
        {value === NOT_FOUND ? (
          param.value.startsWith("$steps.") ? (
            <div>
              <div className="text-danger italic">No value set</div>
              <div className="text-sm font-sans text-muted-foreground">
                Value not found in step
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-start items-center">
              <div className="text-danger italic">No value set</div>
              <Button
                variant="outline"
                size="icon-xs"
                className="w-auto px-1 py-1 hover:text-primary-foreground font-normal"
              >
                <Edit />
                edit
              </Button>
            </div>
          )
        ) : (
          <>
            <pre className="font-mono bg-background overflow-auto max-w-full">
              <code>
                {JSON.stringify(value, null, "\t").replaceAll(
                  '],\n\t"',
                  '],\n\n\t"',
                )}
              </code>
            </pre>
            <div className="text-sm font-sans text-muted-foreground">
              (value selector: {param.value})
            </div>
          </>
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
  const { resolveRuntimeExpression } = useWorkflowStore();
  const resolvedValue = resolveRuntimeExpression(fullStepId);
  const value = resolvedValue === fullStepId ? NOT_FOUND : resolvedValue;

  return (
    <div className="text-sm grid grid-cols-[200px_auto] max-w-full overflow-hidden">
      <div>{output.key}</div>

      <div className="overflow-x-auto">
        {value === NOT_FOUND ? (
          <>
            <em className="text-muted-foreground">No value set</em>
          </>
        ) : (
          <>
            <pre className="font-mono bg-background overflow-auto max-w-full">
              <code>
                {JSON.stringify(value, null, "\t").replaceAll(
                  '],\n\t"',
                  '],\n\n\t"',
                )}
              </code>
            </pre>
            <div className="text-sm font-sans text-muted-foreground">
              (value selector: {output.value})
            </div>
          </>
        )}
      </div>
    </div>
  );
}
