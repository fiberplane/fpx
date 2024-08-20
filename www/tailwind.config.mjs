import starlightPlugin from "@astrojs/starlight-tailwind";

// from fpx
// --background: #0c0a13;
// --foreground: #f1f5f9;
// --card: #0c0a13;
// --card-foreground: #f1f5f9;
// --popover: #0c0a13;
// --popover-foreground: #f1f5f9;
// --primary: #3b82f6;
// --primary-foreground: #101827;
// --secondary: #1e293b;
// --secondary-foreground: #f1f5f9;
// --muted: #1e293b;
// --muted-foreground: #94a3b8;
// --accent: #1e3a8a;
// --accent-foreground: #f1f5f9;
// --destructive: #7f1d1d;
// --destructive-foreground: #f1f5f9;
// --border: #1e293b;
// --input: #1e293b;
// --ring: #2563eb;

// Generated color palettes
const accent = {
  200: "#b0c9f8",
  600: "#205ee5",
  900: "#122e68",
  950: "#102246",
};
const gray = {
  100: "#f5f6f8",
  200: "#eceef2",
  300: "#c0c2c7",
  400: "#888b96",
  500: "#545861",
  700: "#353841",
  800: "#24272f",
  900: "#17181c",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: { accent, gray },
    },
  },
  plugins: [starlightPlugin()],
};
