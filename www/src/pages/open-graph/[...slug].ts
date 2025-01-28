import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

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
    font: {
        title: { size: 72, families: ['Instrument Sans']},
        description: {size: 48, families: ["Geist"]}
    },
    fonts: [
      "./src/pages/open-graph/_fonts/Geist-Light.ttf",
      "./src/pages/open-graph/_fonts/InstrumentSans-SemiBold.ttf"
    ]
  })
});
