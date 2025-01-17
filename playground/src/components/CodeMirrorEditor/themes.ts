import { EditorView } from "@uiw/react-codemirror";

export const customTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    // HACK
    background: "transparent !important",
  },
  ".ͼq": {
    color: "hsl(var(--info))",
  },
  ".ͼu": {
    color: "hsl(var(--success))",
  },
});

export const duotonePlaintextOverride = EditorView.theme({
  ".cm-line": {
    // color: "#eeebff",
  },
});
