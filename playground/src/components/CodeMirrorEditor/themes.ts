import { EditorView } from "@uiw/react-codemirror";

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
  "&.cm-editor.cm-focused .cm-selectionLayer .cm-selectionBackground, &.cm-editor .cm-selectionLayer .cm-selectionBackground, &.cm-editor .cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    background: "hsl(var(--muted)) !important",
  },
});

// NOTE - This used to require overrides in studio but does not really need them anymore
export const duotonePlaintextOverride = EditorView.theme({
  ".cm-line": {},
});
