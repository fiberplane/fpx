/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  useTabs: false,
  trailingComma: "none",
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
