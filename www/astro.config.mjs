import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/docs": "/docs/get-started",
  },
  experimental: {
    contentIntellisense: true,
  },
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
        Sidebar: "@/components/Sidebar.astro",
        Hero: "@/components/Hero.astro",
      },
      customCss: ["@/main.css"],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        styleOverrides: {
          borderRadius: "var(--border-radius)",
        },
      },
    }),
    // NOTE: if we ever go to server rendering or hybrid rendering,
    // we'll need to specify manually which icon sets to include
    // https://github.com/natemoo-re/astro-icon?tab=readme-ov-file#configinclude
    icon(),
  ],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
        },
      ],
    ],
  },
});
