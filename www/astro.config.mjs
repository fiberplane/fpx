import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  site: "https://fiberplane.com",
  redirects: {
    "/docs": "/docs/get-started"
  },
  experimental: {
    contentIntellisense: true
  },
  integrations: [
    starlight({
      logo: {
        src: "@/assets/fp-logo.svg",
        replacesTitle: false
      },
      title: "Fiberplane",
      description:
        "Fiberplane is an API client and a local debugging companion for Hono API.",
      social: {
        github: "https://github.com/fiberplane/fpx",
        discord: "https://discord.com/invite/cqdY6SpfVR"
      },
      sidebar: [
        {
          label: "Quickstart",
          items: ["docs/get-started"]
        },
        {
          label: "Components",
          autogenerate: { directory: "docs/components" }
        },
        {
          label: "Features",
          autogenerate: { directory: "docs/features" }
        },
        {
          label: "nav",
          items: [
            { link: "/docs/get-started", label: "Docs" },
            { link: "/blog", label: "Blog" },
            { link: "/changelog", label: "Changelog" },
          ]
        }
      ],
      head: [
        {
          tag: "script",
          attrs: {
            type: "text/partytown",
            src: "https://www.googletagmanager.com/gtag/js?id=G-FMRLG4PY3L",
            async: true
          }
        },
        {
          tag: "script",
          attrs: {
            type: "text/partytown"
          },
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FMRLG4PY3L');
          `
        }
      ],
      components: {
        Banner: "@/components/Banner.astro",
        Header: "@/components/Header.astro",
        Hero: "@/components/Hero.astro",
        Pagination: "@/components/Pagination.astro",
        Sidebar: "@/components/Sidebar.astro"
      },
      customCss: ["@/main.css"],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        styleOverrides: {
          borderRadius: "var(--border-radius)"
        }
      }
    }),
    // NOTE: if we ever go to server rendering or hybrid rendering,
    // we'll need to specify manually which icon sets to include
    // https://github.com/natemoo-re/astro-icon?tab=readme-ov-file#configinclude
    icon(),
    sitemap(),
    partytown({
      config: {
        forward: ["dataLayer.push"]
      }
    })
  ],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap"
        }
      ]
    ]
  }
});
