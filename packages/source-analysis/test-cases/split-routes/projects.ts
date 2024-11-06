import { Hono } from "hono";

const projects = new Hono();

const PROJECTS = [
  {
    id: 1,
    name: "Project A",
    description: "Project A description",
  },
  {
    id: 2,
    name: "Project B",
    description: "Project B description",
  },
];

projects.get("/api/v1/projects", (c) => {
  return c.json(PROJECTS);
});

projects.get("/api/v1/projects/:id", (c) => {
  const id = Number.parseInt(c.req.param("id"));
  const project = PROJECTS.find((p) => p.id === id);
  return c.json(project);
});

export { projects };
