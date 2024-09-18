import { defineCollection, z } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";

const docs = defineCollection({
  type: "content",
  schema: docsSchema()
});

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    tags: z.array(z.string()),
    image: z
      .object({
        src: z.string(),
        alt: z.string()
      })
      .optional()
  })
});

const changelog = defineCollection({
  type: "content",
  schema: z.object({
    date: z.coerce.date(),
    version: z.string(),
    draft: z.boolean().optional()
  })
});

export const collections = {
  docs,
  blog,
  changelog
};
