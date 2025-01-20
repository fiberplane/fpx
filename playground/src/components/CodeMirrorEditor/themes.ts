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
  ".cm-matchingBracket": {
    "background-color": "hsl(var(--info) / 0.2) !important",
  },
});

// NOTE - This used to require overrides in studio but does not really need them anymore
export const duotonePlaintextOverride = EditorView.theme({
  ".cm-line": {},
});
