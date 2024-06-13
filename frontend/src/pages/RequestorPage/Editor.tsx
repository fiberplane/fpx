export const customTheme = {
  base: "vs" as const,
  inherit: true,
  rules: [
    // { token: 'comment', foreground: 'ffa500', fontStyle: 'italic underline' },
    // { token: 'keyword', foreground: '00ff00' },
    // { token: 'identifier', foreground: 'ffffff' },
    // { token: 'string', foreground: 'ff0000' },
    // { token: 'number', foreground: '00ffff' },
  ],
  colors: {
    "editor.background": "hsl(var(--muted))",
    // 'editor.foreground': '#FFFFFF',
    "editor.lineHighlightBackground": "#2B2B2B",
    // 'editorCursor.foreground': '#FFFFFF',
    // 'editorWhitespace.foreground': '#FFFFFF',
  },
};
