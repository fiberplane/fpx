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
          label: "Quickstart",
          items: ["docs/get-started"],
        },
        {
          label: "Components",
          autogenerate: { directory: "docs/components" },
        },
        {
          label: "Features",
          autogenerate: { directory: "docs/features" },
        },
      ],
      components: {
        Header: "@/components/Header.astro",
        Pagination: "@/components/Pagination.astro",
        ThemeProvider: "@/components/ThemeProvider.astro",
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
