import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { html } from "hono/html";
import * as schema from "../../db/schema";
import { dashboardAuthentication } from "../../lib/session-auth";
import type { AppType } from "../../types";

const router = new Hono<AppType>();

router.use(dashboardAuthentication);

router.get("/", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("currentUser");
  const userId = currentUser?.id ?? "";
  const apiKeys = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, userId));

  const projects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, userId));

  const jwt = apiKeys?.[0]?.key;

  return c.html(
    <div>
      <nav>
        logged in as {c.get("currentUser")?.githubUsername} |{" "}
        <a href="/logout">Logout</a>
      </nav>
      <h1>Lilo</h1>
      <main>
        <section>
          <h2>API Keys</h2>
          <ul>
            {apiKeys.map((apiKey) => (
              <li key={apiKey.id}>
                {apiKey.name}{" "}
                <button type="button" data-token={apiKey.key}>
                  Copy
                </button>
              </li>
            ))}
          </ul>
          <form id="apiKeyForm">
            <input type="text" name="name" placeholder="Name" />
            <button type="submit">Create an API Key</button>
          </form>
        </section>
        <section>
          <h2>Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>
          <form id="projectForm">
            <input type="text" name="name" placeholder="Name" />
            <textarea name="spec" placeholder="Specification" />
            <button type="submit">Create a Project</button>
          </form>
        </section>
      </main>
      {html`
        <script>
          const jwt = "${jwt ?? ""}"

          const copyButton = document.querySelectorAll("[data-token]");
          copyButton.forEach((button) => {
            button.addEventListener("click", (e) => {
              const token = e.target.getAttribute("data-token");
              navigator.clipboard.writeText(token);
            });
          });

          document.getElementById("projectForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
              name: formData.get("name"),
              spec: formData.get("spec")
            };

            try {
              const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + jwt
                },
                body: JSON.stringify(data)
              });

              if (!response.ok) {
                throw new Error("Failed to create project");
              }

              // Refresh the page to show the new project
              window.location.reload();
            } catch (error) {
              console.error("Error creating project:", error);
              alert("Failed to create project. Please try again.");
            }
          });

          document.getElementById("apiKeyForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
              name: formData.get("name"),
            };

            try {
              const response = await fetch("/internal/api-keys", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(data)
              });

              if (!response.ok) {
                throw new Error("Failed to create API key");
              }

              const apiKeyResponse = await response.json();
              // Refresh the page to show the new API key
              window.alert("API key created: " + apiKeyResponse.token);
              window.location.reload();
            } catch (error) {
              console.error("Error creating API key:", error);
              alert("Failed to create API key. Please try again.");
            }
          });
        </script>
        `}
    </div>,
  );
});

export { router as dashboardRouter };
