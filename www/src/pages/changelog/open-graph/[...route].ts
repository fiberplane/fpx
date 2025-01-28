import { OGImageRoute } from "astro-og-canvas";

import { ogImageOptions } from "@/ogImageOptions";

export const { getStaticPaths, GET } = OGImageRoute({
  param: "route",
  pages: {
    changelog: {
      title: "Changelog",
      description: "See the latest releases and updates."
    }
  },
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    ...ogImageOptions
  })
});
  