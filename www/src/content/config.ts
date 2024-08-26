import { defineCollection, z } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";

const blogSchema = z.object({
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
	author: z.string(),
	tags: z.array(z.string()),
	image: z.object({
		src: z.string(),
		alt: z.string(),
	}).optional(),
});

export const collections = {
	docs: defineCollection({ schema: docsSchema() }),
	blog: defineCollection({
		type: "content",
		schema: blogSchema
	}),
};
