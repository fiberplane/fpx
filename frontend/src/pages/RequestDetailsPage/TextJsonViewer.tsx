import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";

export function TextOrJsonViewer({ text }: { text: string }) {
  try {
    const json = JSON.parse(text);
    // @ts-expect-error hacky way to just quickly change the background color
    nordTheme["--w-rjv-background-color"] = "transparent";
    return <JsonView value={json} style={nordTheme} displayDataTypes={false} />;
  } catch (error) {
    return <pre>{text}</pre>;
  }
}
