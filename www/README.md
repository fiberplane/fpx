# Fiberplane website and docs

This repository contains the code and content for the [Fiberplane website](https://fiberplane.com).

It is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

The website is part of the Fiberplane monorepo and is built with [pnpm](https://pnpm.io).

## Development

To run the website locally, you need to have [pnpm](https://pnpm.io) installed.

Then, run the following commands:

```bash
pnpm install
pnpm run dev # (or pnpm run dev:www from the root of the repo)
```

## Converting blog posts for dev.to

If you also want to publish a blogpost on dev.to you need to convert the mdx file to md file. You can leverage co-pilot to help you. In the prompt copy-paste the instructions from dev.to and add a small explainer of what you want to do with the input file.

Example:

```
please help me convert this MDX file to a format i can copy paste into dev.to's markdown editor in order to cross publish the blog post.

these are the instructions on dev.to for crafting markdown posts in their editor:

You are currently using the basic markdown editor that uses Jekyll front matter. You can also use the rich+markdown editor you can find in UX settings.
Editor Basics
Use Markdown to write and format posts.
Commonly used syntax
Embed rich content such as Tweets, YouTube videos, etc. Use the complete URL: {% embed https://... %}. See a list of supported embeds.
In addition to images for the post's content, you can also drag and drop a cover image.
Publishing Tips
Ensure your post has a cover image set to make the most of the home feed and social media platforms.
Share your post on social media platforms or with your co-workers or local communities.
Ask people to leave questions for you in the comments. It's a great way to spark additional discussion describing personally why you wrote it or why people might find it helpful.
```
