import {
  createFileRoute,
  useRouteContext,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { WorkflowStep, Parameter } from "@/types";
import { validate } from "@scalar/openapi-parser";
import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { CodeMirrorInput } from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { useWorkflowStore } from "@/lib/workflowStore";

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
      return schema;
    },
    enabled: !!openapi?.content,
  });

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
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedStep && <StepDetails step={selectedStep} />}
    </div>
  );
}

interface StepDetailsProps {
  step: WorkflowStep;
}

function StepDetails({ step }: StepDetailsProps) {
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
              <p className="text-sm text-foreground">{step.operation}</p>
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

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function StepCard({ step, index, isSelected, onSelect }: StepCardProps) {
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
            <p className="text-sm text-foreground">{step.operation}</p>
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
        {resolvedValue}
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
