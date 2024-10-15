import fs from "node:fs";
import type { Context } from "@/context";
import { getNeonAuthToken } from "@/integrations/neon";
import { isCancel, log, select, text } from "@clack/prompts";
import { type Api, type Role, createApiClient } from "@neondatabase/api-client";

/*
 * Used if the user rejects the Neon setup flow
 */
export function showNeonSetupInstructions() {
  log.step("Setting up Neon:");
  log.step(`Create a Neon account and project, retrieve the connection key from the dashboard, and add it to your .dev.vars file.

DATABASE_URL=postgres://....
`);
  log.step(
    "Visit https://neon.tech/docs/get-started-with-neon/connect-neon to create an account and project.",
  );
}

export async function runNeonSetup(ctx: Context) {
  log.step(`Setting up Neon:

In order to connect to your database project and retrieve the connection key, you'll need to authenticate with Neon.

The connection URI will be written to your .dev.vars file as DATABASE_URL. The token itself will *NOT* be stored anywhere after this session is complete.
		`);

  try {
    const token = await getNeonAuthToken();

    log.success("Neon authentication successful");

    const neon = createApiClient({ apiKey: token.access_token });

    const project = await createOrSelectProject(neon);
    if (isCancel(project)) {
      return project;
    }

    const branch = await selectProjectBranch(neon, project);
    if (isCancel(branch)) {
      return branch;
    }

    const allRoles = await fetchProjectBranchRoles(neon, project, branch);

    const databaseResult = await configureDatabase(
      neon,
      project,
      branch,
      allRoles,
    );
    if (isCancel(databaseResult)) {
      return databaseResult;
    }

    const [database, role] = databaseResult;

    const connectionUri = await fetchConnectionUri(
      neon,
      role,
      project,
      database,
    );

    ctx.databaseConnectionString = connectionUri;

    await recordConnectionUri(ctx, connectionUri);

    return;
  } catch (error) {
    return error;
  }
}

async function createOrSelectProject(
  neon: Api<unknown>,
): Promise<string | symbol> {
  const neonProjects = await Promise.all([
    ...(await neon.listProjects({})).data.projects,
    ...(await neon.listSharedProjects({})).data.projects,
  ]);

  const projectOptions = neonProjects.map((project) => ({
    label: project.name,
    value: project.id,
    hint: `Last updated: ${project.updated_at}${project.org_id ? ` (Shared project, Org ID: ${project.org_id})` : ""}`,
  }));

  projectOptions.push({
    label: "Create a new project",
    value: "cha-create-project",
    hint: "Create a new project using the create-honc-app",
  });

  const projectChoice = await select({
    message: "Select a Neon project to use:",
    options: projectOptions,
  });

  if (isCancel(projectChoice)) {
    return projectChoice;
  }

  if (projectChoice === "cha-create-project") {
    return createNewProject(neon);
  }

  return projectChoice as string;
}

async function createNewProject(neon: Api<unknown>): Promise<string | symbol> {
  const projectName = await text({
    message: "What is the name of the project?",
    validate: (value) => {
      if (value === "") {
        return "Please enter a project name.";
      }
      if (value.length > 64) {
        return "Project name must be less than 64 characters.";
      }
    },
  });

  if (isCancel(projectName)) {
    return projectName;
  }

  const project = await neon.createProject({
    project: {
      name: projectName,
    },
  });

  log.success(
    `Project created successfully: ${project.data.project.name} on branch: ${project.data.branch.name}`,
  );

  return project.data.project.id;
}

async function selectProjectBranch(
  neon: Api<unknown>,
  project: string,
): Promise<string | symbol> {
  const branches = (await neon.listProjectBranches(project)).data.branches;
  const branchOptions = branches.map((branch) => ({
    label: branch.name,
    value: branch.id,
    hint: `Last updated: ${branch.updated_at}`,
  }));

  return await select({
    message: "Select a project branch to use:",
    options: branchOptions,
  });
}

async function fetchProjectBranchRoles(
  neon: Api<unknown>,
  project: string,
  branch: string,
): Promise<Role[]> {
  return (await neon.listProjectBranchRoles(project, branch)).data.roles;
}

async function fetchConnectionUri(
  neon: Api<unknown>,
  role: string,
  project: string,
  database: string,
): Promise<string> {
  const connectionUriResp = await neon.getConnectionUri({
    role_name: role,
    projectId: project,
    database_name: database,
  });
  return connectionUriResp.data.uri;
}

async function recordConnectionUri(
  ctx: Context,
  connectionUri: string,
): Promise<void> {
  log.step("Writing connection string to .dev.vars file");
  fs.writeFileSync(`${ctx.path}/.dev.vars`, `DATABASE_URL=${connectionUri}\n`);
  log.success("Neon connection string written to .dev.vars file");
}

async function configureDatabase(
  neon: Api<unknown>,
  projectId: string,
  branchId: string,
  roles: Role[],
): Promise<[string, string] | symbol> {
  const databaseOptions = (
    await neon.listProjectBranchDatabases(projectId, branchId)
  ).data.databases.map((database) => ({
    label: database.name,
    value: database.name,
    hint: `Last updated: ${database.updated_at}`,
  }));

  databaseOptions.push({
    label: "Create a new database",
    value: "cha-create-database",
    hint: "Create a new database using the create-honc-app",
  });

  const databaseChoice = await select({
    message: "Select a database you want to connect to:",
    options: databaseOptions,
  });

  if (isCancel(databaseChoice)) {
    return databaseChoice;
  }

  const role = await select({
    message: "Select which role to use to connect to the database:",
    initialValue: "neondb_owner",
    options: roles.map((role) => ({
      label: role.name,
      value: role.name,
    })),
  });

  if (isCancel(role)) {
    return role;
  }

  if (databaseChoice !== "cha-create-database") {
    return [databaseChoice as string, role as string];
  }

  return createNewDatabase(neon, projectId, branchId, role as string);
}

async function createNewDatabase(
  neon: Api<unknown>,
  projectId: string,
  branchId: string,
  role: string,
): Promise<[string, string] | symbol> {
  const databaseName = await text({
    message: "What should be the name of the database?",
    validate: (value) => {
      if (value === "") {
        return "Please enter a database name.";
      }
      if (value.length > 64) {
        return "Database name must be less than 64 characters.";
      }
    },
  });

  if (isCancel(databaseName)) {
    return databaseName;
  }

  const database = (
    await neon.createProjectBranchDatabase(projectId, branchId, {
      database: {
        name: databaseName,
        owner_name: role,
      },
    })
  ).data.database;

  return [database.name, role];
}
