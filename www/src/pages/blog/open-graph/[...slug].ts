import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

import { ogImageOptions } from "@/ogImageOptions";

const blogEntries = await getCollection("blog");
const pages = Object.fromEntries(
  blogEntries.map(({ slug, data }) => [slug, data])
);

export const { getStaticPaths, GET } = OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    ...ogImageOptions
  })
});
