import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
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
      ],
      // HACK - Disable pagefind search until we have searchable content!
      pagefind: false,
      components: {
        ThemeSelect: "./src/components/ThemeSelect.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
      },
      customCss: ["./src/tailwind.css"],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
