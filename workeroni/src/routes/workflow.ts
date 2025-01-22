import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  type Variables,
  workflowSchema,
  createWorkflowSchema,
} from "../schemas/index.js";
import {
  oaiSchema as oaiSchemaTable,
  workflow as workflowTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateWorkflow } from "../ai/index.js";

const router = new OpenAPIHono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

const fakeData = [
  {
    "id": "loginUserAndCreateWorkflow",
    "prompt": "Create a workflow that logs in a user and creates their first workspace",
    "summary": "User Login and Workspace Creation",
    "description": "Authenticates a user with their credentials and creates their initial workspace environment. Includes validation, authentication, and workspace setup steps.",
    "openApiSchemaId": "user-service-api-v1",
    "steps": [
      {
        "stepId": "validateCredentials",
        "description": "Validate the provided user credentials format",
        "operation": "validateUserCredentials",
        "parameters": [
          {
            "name": "email",
            "value": "$.inputs.email"
          },
          {
            "name": "password",
            "value": "$.inputs.password"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 200"
          },
          {
            "condition": "$response.body#/valid === true"
          }
        ],
        "outputs": []
      },
      {
        "stepId": "authenticateUser",
        "description": "Authenticate user and obtain session token",
        "operation": "authenticateUser",
        "parameters": [
          {
            "name": "email",
            "value": "$.inputs.email"
          },
          {
            "name": "password",
            "value": "$.inputs.password"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 200"
          },
          {
            "condition": "$response.body#/token !== null"
          }
        ],
        "outputs": [
          {
            "key": "sessionToken",
            "value": "$response.body#/token"
          },
          {
            "key": "userId",
            "value": "$response.body#/userId"
          }
        ]
      },
      {
        "stepId": "createWorkspace",
        "description": "Create initial workspace for the user",
        "operation": "createUserWorkspace",
        "parameters": [
          {
            "name": "userId",
            "value": "$.steps.authenticateUser.outputs.userId"
          },
          {
            "name": "name",
            "value": "$.inputs.workspaceName"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 201"
          }
        ],
        "outputs": [
          {
            "key": "workspaceId",
            "value": "$response.body#/id"
          }
        ]
      }
    ],
    "createdAt": "2025-01-22T10:00:00.000Z",
    "updatedAt": "2025-01-22T10:00:00.000Z"
  },
  {
    "id": "createTeamAndInviteMembers",
    "prompt": "Create a workflow for setting up a new team and inviting members",
    "summary": "Team Creation and Member Invitation",
    "description": "Creates a new team within a workspace, configures initial team settings, and sends invitations to team members.",
    "openApiSchemaId": "team-service-api-v1",
    "steps": [
      {
        "stepId": "createTeam",
        "description": "Create a new team in the specified workspace",
        "operation": "createTeam",
        "parameters": [
          {
            "name": "workspaceId",
            "value": "$.inputs.workspaceId"
          },
          {
            "name": "teamName",
            "value": "$.inputs.teamName"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 201"
          }
        ],
        "outputs": [
          {
            "key": "teamId",
            "value": "$response.body#/teamId"
          }
        ]
      },
      {
        "stepId": "configureTeamSettings",
        "description": "Configure initial team settings and permissions",
        "operation": "updateTeamSettings",
        "parameters": [
          {
            "name": "teamId",
            "value": "$.steps.createTeam.outputs.teamId"
          },
          {
            "name": "settings",
            "value": "$.inputs.teamSettings"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 200"
          }
        ],
        "outputs": []
      },
      {
        "stepId": "inviteMembers",
        "description": "Send invitations to team members",
        "operation": "createBulkTeamInvites",
        "parameters": [
          {
            "name": "teamId",
            "value": "$.steps.createTeam.outputs.teamId"
          },
          {
            "name": "emails",
            "value": "$.inputs.memberEmails"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 200"
          },
          {
            "condition": "$response.body#/failedInvites.length === 0"
          }
        ],
        "outputs": [
          {
            "key": "inviteIds",
            "value": "$response.body#/invites[*].id"
          }
        ]
      }
    ],
    "createdAt": "2025-01-22T11:00:00.000Z",
    "updatedAt": "2025-01-22T11:00:00.000Z"
  },
  {
    "id": "projectSetupWorkflow",
    "prompt": "Create a workflow for setting up a new project with initial resources",
    "summary": "Project Setup and Resource Creation",
    "description": "Creates a new project within a team, sets up initial project resources including repositories and development environments.",
    "openApiSchemaId": "project-service-api-v1",
    "steps": [
      {
        "stepId": "createProject",
        "description": "Create a new project within the team",
        "operation": "createProject",
        "parameters": [
          {
            "name": "teamId",
            "value": "$.inputs.teamId"
          },
          {
            "name": "projectName",
            "value": "$.inputs.projectName"
          },
          {
            "name": "description",
            "value": "$.inputs.projectDescription"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 201"
          }
        ],
        "outputs": [
          {
            "key": "projectId",
            "value": "$response.body#/id"
          }
        ]
      },
      {
        "stepId": "setupRepository",
        "description": "Create and configure project repository",
        "operation": "createProjectRepository",
        "parameters": [
          {
            "name": "projectId",
            "value": "$.steps.createProject.outputs.projectId"
          },
          {
            "name": "repoConfig",
            "value": "$.inputs.repositoryConfig"
          }
        ],
        "successCriteria": [
          {
            "condition": "$response.statusCode === 201"
          },
          {
            "condition": "$response.body#/status === 'active'"
          }
        ],
        "outputs": [
          {
            "key": "repoUrl",
            "value": "$response.body#/cloneUrl"
          }
        ]
      }
    ],
    "createdAt": "2025-01-22T12:00:00.000Z",
    "updatedAt": "2025-01-22T12:00:00.000Z"
  }
];

// GET /workflow
router.openapi(
  {
    method: "get",
    path: "/workflow",
    tags: ["Workflow"],
    summary: "List all workflows",
    responses: {
      200: {
        description: "List of workflows",
        content: {
          "application/json": {
            schema: apiResponseSchema(z.array(workflowSchema)),
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const db = c.get("db");
    // const workflows = await db.select().from(workflowTable);
    const openApiSchemaId = await db
      .select()
      .from(oaiSchemaTable)
      .limit(1)
      .then((rows) => rows[0].id);
    const workflows = fakeData;

    return c.json({ 
      data: workflows,
    }, 200);
  },
);

// POST /workflow/create
router.openapi(
  {
    method: "post",
    path: "/workflow/create",
    tags: ["Workflow"],
    summary: "Create a new workflow",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createWorkflowSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Workflow created",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    try {
      const body = await c.req.valid("json");
      const newId = crypto.randomUUID();
      const db = c.get("db");
      const openApiSchemaId = body.openApiSchemaId;
      const openApiSchemaContent = await db
        .select()
        .from(oaiSchemaTable)
        .where(eq(oaiSchemaTable.id, openApiSchemaId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!openApiSchemaContent) {
        throw new Error("OpenAPI schema not found");
      }

      // Generate workflow using AI
      const generatedWorkflow = await generateWorkflow({
        userStory: body.prompt,
        oaiSchema: openApiSchemaContent.content,
      });

      const now = new Date();
      const workflowData = {
        id: newId,
        prompt: body.prompt,
        summary: generatedWorkflow.summary,
        description: generatedWorkflow.description,
        oaiSchemaId: openApiSchemaContent.id,
        steps: generatedWorkflow.steps,
        createdAt: now,
        updatedAt: now,
      };

      // Insert into database with proper types
      await db.insert(workflowTable).values({
        id: workflowData.id,
        prompt: workflowData.prompt,
        summary: workflowData.summary,
        description: workflowData.description,
        oaiSchemaId: workflowData.oaiSchemaId,
        steps: workflowData.steps,
        createdAt: workflowData.createdAt,
        updatedAt: workflowData.updatedAt,
      } satisfies typeof workflowTable.$inferInsert);

      // Return API response with proper types
      return c.json(
        {
          data: {
            id: workflowData.id,
            prompt: workflowData.prompt,
            summary: workflowData.summary,
            description: workflowData.description,
            openApiSchemaId: workflowData.oaiSchemaId,
            steps: workflowData.steps,
            createdAt: workflowData.createdAt.toISOString(),
            updatedAt: workflowData.updatedAt.toISOString(),
          },
        },
        201,
      );
    } catch (error) {
      return c.json({ error: { message: "Failed to generate workflow" } }, 500);
    }
  },
);

// GET /workflow/:id
router.openapi(
  {
    method: "get",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Get workflow by ID",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    responses: {
      200: {
        description: "Workflow details",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: { message: "Invalid workflow ID" } }, 400);
    }

    // const workflow = await db
    //   .select()
    //   .from(workflowTable)
    //   .where(eq(workflowTable.id, id))
    //   .limit(1)
    //   .then((rows) => rows[0]);

    const workflow = fakeData.find((workflow) => workflow.id === id);

    if (!workflow) {
      return c.json({ error: { message: "Workflow not found" } }, 404);
    }

    return c.json(
      {
        data: {
          id: workflow.id,
          prompt: workflow.prompt,
          openApiSchemaId: workflow.openApiSchemaId,
          steps: workflow.steps,
          summary: workflow.summary,
          description: workflow.description,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
      },
      200,
    );
  },
);

// PUT /workflow/:id
router.openapi(
  {
    method: "put",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Update workflow",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createWorkflowSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Workflow updated",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: { message: "Invalid workflow ID" } }, 400);
    }

    const db = c.get("db");
    const existingWorkflow = await db.query.workflow.findFirst({
      where: eq(workflowTable.id, id),
    });

    if (!existingWorkflow) {
      return c.json({ error: { message: "Workflow not found" } }, 404);
    }

    const body = await c.req.valid("json");
    const updatedWorkflow = {
      ...existingWorkflow,
      ...body,
      updatedAt: new Date(),
    };

    await db
      .update(workflowTable)
      .set(updatedWorkflow)
      .where(eq(workflowTable.id, id));

    return c.json(
      {
        data: {
          ...updatedWorkflow,
          createdAt: updatedWorkflow.createdAt.toISOString(),
          updatedAt: updatedWorkflow.updatedAt.toISOString(),
        },
      },
      200,
    );
  },
);

// DELETE /workflow/:id
router.openapi(
  {
    method: "delete",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Delete workflow",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    responses: {
      204: {
        description: "Workflow deleted",
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: { message: "Invalid workflow ID" } }, 400);
    }

    const exists = await db.query.workflow.findFirst({
      where: eq(workflowTable.id, id),
    });

    if (!exists) {
      return c.json({ error: { message: "Workflow not found" } }, 404);
    }

    await db.delete(workflowTable).where(eq(workflowTable.id, id));
    return new Response(null, { status: 204 });
  },
);

export default router;
