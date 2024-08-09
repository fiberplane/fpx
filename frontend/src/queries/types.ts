import { z } from "zod";

export const GitHubLabelSchema = z.union([
  z.string(),
  z.object({
    id: z.number().optional(),
    node_id: z.string().optional(),
    url: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    default: z.boolean().optional(),
  }),
]);

export const GitHubIssueSchema = z.object({
  id: z.number(),
  owner: z.string(),
  repo: z.string(),
  url: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(["open", "closed"]),
  labels: z.array(GitHubLabelSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable(),
});

export type GithubIssue = z.infer<typeof GitHubIssueSchema>;

export const GitHubIssuesSchema = z.array(GitHubIssueSchema);

export const DependencySchema = z.object({
  name: z.string(),
  version: z.string(),
  repository: z.object({
    owner: z.string(),
    repo: z.string(),
    url: z.string(),
  }),
});
export type Dependency = z.infer<typeof DependencySchema>;

export const DependenciesSchema = z.array(DependencySchema);

export type Dependencies = z.infer<typeof DependenciesSchema>;
