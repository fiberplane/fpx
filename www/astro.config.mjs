import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      logo: {
        src: "@/assets/fp-logo.png",
        replacesTitle: true,
      },
      title: "Fiberplane",
      description:
        "Fiberplane is an API client and a local debugging companion for Hono API.",
      social: {
        github: "https://github.com/fiberplane/fpx",
        discord: "https://discord.com/invite/cqdY6SpfVR",
      },
      sidebar: [
        {
          label: "Home",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Get started", slug: "home/get-started" },
          ],
        },
        {
          label: "Components",
          items: [
            { label: "Client library", slug: "components/client-library" },
            { label: "Studio", slug: "components/studio" },
          ],
        },
        {
          label: "Features",
          items: [
            { label: "Making requests", slug: "features/making-requests" },
            { label: "Showing traces", slug: "features/showing-traces" },
            {
              label: "Generating with AI",
              slug: "features/generating-with-ai",
            },
            {
              label: "Generating prompts for tests",
              slug: "features/generating-prompts-for-tests",
            },
            { label: "Webhooks", slug: "features/webhooks" },
          ],
        },
      ],
      components: {
        Header: "@/components/Header.astro",
        Pagination: "@/components/Pagination.astro",
      },
      customCss: ["@/main.css"],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        styleOverrides: {
          borderRadius: "var(--border-radius)",
        },
      },
    }),
  ],
});
