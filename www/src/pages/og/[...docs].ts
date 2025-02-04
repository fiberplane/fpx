import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

import { ogImageOptions } from "@/ogImageOptions";

const docsEntries = await getCollection("docs");
const pages = Object.fromEntries(
  docsEntries.map(({ slug, data }) => [slug, data])
);

export const { getStaticPaths, GET } = OGImageRoute({
  param: "docs",
  pages,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    ...ogImageOptions
  })
});
