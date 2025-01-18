/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        "fp-method": {
          get: "hsl(var(--fp-method-get))",
          post: "hsl(var(--fp-method-post))",
          put: "hsl(var(--fp-method-put))",
          delete: "hsl(var(--fp-method-delete))",
          patch: "hsl(var(--fp-method-patch))",
          head: "hsl(var(--fp-method-head))",
          options: "hsl(var(--fp-method-options))",
          trace: "hsl(var(--fp-method-trace))",
          "get-bg": "hsl(var(--fp-method-get-bg))",
          "post-bg": "hsl(var(--fp-method-post-bg))",
          "put-bg": "hsl(var(--fp-method-put-bg))",
          "delete-bg": "hsl(var(--fp-method-delete-bg))",
          "patch-bg": "hsl(var(--fp-method-patch-bg))",
          "head-bg": "hsl(var(--fp-method-head-bg))",
          "options-bg": "hsl(var(--fp-method-options-bg))",
          "trace-bg": "hsl(var(--fp-method-trace-bg))",
        },
        info: "hsl(var(--info))",
        success: "hsl(var(--success))",
        danger: "hsl(var(--danger))",
        warning: "hsl(var(--warning))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
