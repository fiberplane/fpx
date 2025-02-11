import { EditorView } from "@uiw/react-codemirror";

export const sqlThemeAdditionalStyles = EditorView.theme({
  // This is for highlighted lines, is a little to low contrast at the moment
  ".cm-activeLine": {
    background: "hsl(var(--muted)) !important",
  },
  // This is for the active line gutter, is a little to low contrast at the moment
  ".cm-activeLineGutter": {
    background: "hsl(var(--primary) / 0.10) !important",
  },
  // NOTE - This is for the SQL editor, columns inside SELECT clause
  ".ͼ1v": {
    color: "hsl(var(--info))",
  },
  // This is for commas
  ".ͼ1x": {
    color: "hsl(var(--info) / 0.5)",
  },
  // This is for SELECT and commas
  ".ͼ1s": {
    color: "hsl(var(--warning))",
  },
});

export const customTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    // HACK
    background: "transparent !important",
  },
  // NOTE - These classnames use greek letter `koppa`, not a `c`
  ".ͼq": {
    color: "hsl(var(--destructive))",
  },
  ".ͼu": {
    color: "hsl(var(--success))",
  },
  ".ͼt": {
    color: "hsl(var(--info))",
  },
  ".ͼ1d": {
    color: "hsl(var(--secondary-foreground) / 0.6)",
  },

  ".cm-matchingBracket": {
    "background-color": "hsl(var(--info) / 0.2) !important",
  },
  ".cm-gutters": {
    background: "hsl(var(--muted)) !important",
  },
  ".cm-selectionLayer .cm-selectionBackground": {
    background: "hsl(var(--muted)) !important",
  },
  ".cm-focused .cm-selectionBackground": {
    background: "hsl(var(--muted)) !important",
  },
  // Maximum specificity targeting
  "&.cm-editor.cm-focused .cm-selectionLayer .cm-selectionBackground, &.cm-editor .cm-selectionLayer .cm-selectionBackground, &.cm-editor .cm-focused .cm-selectionBackground, .cm-selectionBackground":
    {
      background: "hsl(var(--muted)) !important",
    },
});

// NOTE - This used to require overrides in studio but does not really need them anymore
export const duotonePlaintextOverride = EditorView.theme({
  ".cm-line": {},
});
