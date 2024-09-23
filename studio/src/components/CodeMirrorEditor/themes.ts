import { EditorView } from "@uiw/react-codemirror";

export const customTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    // HACK
    background: "transparent !important",
  },
});
