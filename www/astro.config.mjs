import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

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
        dark: "@/assets/fp-logo-dark.png",
        light: "@/assets/fp-logo-light.png",
        replacesTitle: true,
        alt: "Fiberplane icon logo & text"
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
          label: "Docs",
          items: [
            {
              label: "Quickstart",
              items: ["docs/get-started"]
            },
            {
              label: "Features",
              autogenerate: { directory: "docs/features" }
            }
          ]
        },
        {
          label: "MCP Gateway",
          autogenerate: { directory: "docs/mcp-gateway" }
        },
        {
          label: "MCP Lite",
          autogenerate: { directory: "docs/mcp-lite" }
        },
        { label: "Blog", link: "/blog" },
        { label: "Changelog", link: "/changelog" }
      ],
      favicon: "/favicon.svg",
      head: [
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/png",
            href: "/favicon-96x96.png",
            sizes: "96x96"
          }
        },
        {
          tag: "link",
          attrs: {
            rel: "shortcut icon",
            href: "/favicon.ico"
          }
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: "/apple-touch-icon.png"
          }
        },
        {
          tag: "meta",
          attrs: {
            name: "apple-mobile-web-app-title",
            content: "Fiberplane"
          }
        },
        {
          tag: "link",
          attrs: {
            rel: "manifest",
            href: "/site.webmanifest"
          }
        },
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
        Footer: "@/components/Footer.astro",
        Head: "@/components/Head.astro",
        Header: "@/components/Header.astro",
        Hero: "@/components/Hero.astro"
      },
      customCss: ["@/main.css"],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        styleOverrides: {
          borderRadius: "var(--border-radius)"
        }
      }
    }),
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
