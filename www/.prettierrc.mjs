/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  useTabs: false,
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
