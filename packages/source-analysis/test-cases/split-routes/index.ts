import { Hono } from "hono";
import { cors } from "hono/cors";
import { users } from "./users";

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

const app = new Hono();
app.use(cors());
app.route("/", users);
app.route("/", projects);

export default app;
