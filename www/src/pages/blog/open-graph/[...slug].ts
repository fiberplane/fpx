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
    bgGradient: [
      [27, 26, 24],
      [35, 34, 32]
    ],
    logo: { path: "./src/assets/fp-og-logo.png", size: [150, 150] },
    font: {
      title: { size: 72, families: ["Instrument Sans"] },
      description: { size: 48, families: ["Geist"] }
    },
    // padding: 40,
    fonts: [
      "./src/pages/blog/open-graph/_fonts/Geist-Light.ttf",
      "./src/pages/blog/open-graph/_fonts/InstrumentSans-SemiBold.ttf"
    ]
  })
});
