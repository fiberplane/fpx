import { OGImageRoute } from "astro-og-canvas";

import { ogImageOptions } from "@/ogImageOptions";

export const { getStaticPaths, GET } = OGImageRoute({
  param: "landing",
  pages: {
    landing: {
      title: "Fiberplane",
      description:
        "Fiberplane helps you build, test and debug your API with the full context of your source code and runtime behavior."
    }
  },
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    ...ogImageOptions
  })
});
