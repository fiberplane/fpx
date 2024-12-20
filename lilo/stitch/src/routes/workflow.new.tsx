import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// Move the interfaces
interface WorkflowParameter {
  name: string;
  in: string;
  value: string;
}

interface WorkflowCriteria {
  condition: string;
}

interface WorkflowStep {
  stepId: string;
  operationPath: string;
  parameters: WorkflowParameter[];
  successCriteria: WorkflowCriteria[];
  onFailure?: Array<{
    name: string;
    type: string;
    retryAfter?: number;
    retryLimit?: number;
  }>;
  outputs?: {
    projectId?: string;
    promptId?: string;
    [key: string]: string | undefined;
  };
  status?: "success" | "failed" | "pending";
}

interface WorkflowData {
  workflowId: string;
  summary: string;
  description: string;
  inputs: Record<string, string>;
  steps: WorkflowStep[];
  successActions: Array<{ name: string; type: string }>;
  failureActions: Array<{ name: string; type: string }>;
  outputs: Record<string, string>;
}

export const Route = createFileRoute("/workflow/new")({
  component: WorkflowGenerator,
});

function WorkflowGenerator() {
  const [userStory, setUserStory] = useState("");
  const [generatedWorkflow, setGeneratedWorkflow] =
    useState<WorkflowData | null>(null);

  const generateWorkflow = () => {
    // This is a mock implementation. In a real-world scenario, you would send the user story
    // to your backend API and receive the generated workflow.
    const mockWorkflow: WorkflowData = {
      workflowId: "create-project-from-prompt-workflow",
      summary: "Create and process a project from a user story prompt",
      description:
        "This workflow handles the creation and processing of a project based on a user story prompt.",
      inputs: {
        userStory,
      },
      steps: [
        {
          stepId: "create-project",
          operationPath: "/api/projects",
          parameters: [
            {
              name: "name",
              in: "body",
              value: "Generated Project",
            },
          ],
          successCriteria: [
            {
              condition: "response.status === 201",
            },
          ],
          onFailure: [
            {
              name: "retry-create-project",
              type: "retry",
              retryAfter: 1000,
              retryLimit: 3,
            },
          ],
          outputs: {
            projectId: "generated-project-id",
          },
          status: "pending",
        },
        {
          stepId: "create-prompt",
          operationPath: "/api/prompts",
          parameters: [
            {
              name: "projectId",
              in: "body",
              value: "${outputs.create-project.projectId}",
            },
            {
              name: "content",
              in: "body",
              value: "${inputs.userStory}",
            },
          ],
          successCriteria: [
            {
              condition: "response.status === 201",
            },
          ],
          outputs: {
            promptId: "generated-prompt-id",
            promptStatus: "completed",
          },
          status: "pending",
        },
      ],
      successActions: [
        {
          name: "notify-success",
          type: "notification",
        },
      ],
      failureActions: [
        {
          name: "handle-workflow-failure",
          type: "end",
        },
      ],
      outputs: {
        projectId: "generated-project-id",
        promptId: "generated-prompt-id",
        promptStatus: "completed",
      },
    };

    setGeneratedWorkflow(mockWorkflow);
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="user-story"
          className="block mb-2 text-sm font-medium text-foreground"
        >
          User Story
        </label>
        <Textarea
          id="user-story"
          rows={4}
          value={userStory}
          onChange={(e) => setUserStory(e.target.value)}
          placeholder="Enter a user story or description of the desired workflow..."
          className="w-full"
        />
      </div>
      <div>
        <Button onClick={generateWorkflow}>
          <Play className="w-4 h-4 mr-2" />
          Generate Workflow
        </Button>
      </div>
      {generatedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle>{generatedWorkflow.summary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-4 text-sm font-medium">Workflow Steps</h4>
              {generatedWorkflow.steps.map((step) => (
                <Card key={step.stepId} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {step.stepId}
                      </CardTitle>
                      <Badge variant="outline">{step.operationPath}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Parameters:</h5>
                      <ul className="pl-5 text-sm list-disc">
                        {step.parameters.map((param) => (
                          <li key={`${step.stepId}-${param.name}`}>
                            {param.name}: {param.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Success Criteria:</h5>
                      <ul className="pl-5 text-sm list-disc">
                        {step.successCriteria.map((criteria) => (
                          <li key={`${step.stepId}-${criteria.condition}`}>
                            {criteria.condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
