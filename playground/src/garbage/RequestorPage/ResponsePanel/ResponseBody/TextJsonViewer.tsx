import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";
import { ResponseBodyText } from "./ResponseBodyText";

export function TextOrJsonViewer({
  text,
  collapsed = true,
  textMaxPreviewLength,
  textMaxPreviewLines,
}: {
  text: string;
  collapsed?: boolean | undefined;
  textMaxPreviewLength?: number | null;
  textMaxPreviewLines?: number | null;
}) {
  try {
    const json = JSON.parse(text);
    // HACK - JsonView freaks out if the value isn't an object
    if (typeof json === "string" || typeof json === "number" || json === null) {
      return <pre>{text}</pre>;
    }
    // @ts-expect-error hacky way to just quickly change the background color
    nordTheme["--w-rjv-background-color"] = "transparent";
    // @ts-expect-error hacky way to just quickly change the info text color
    nordTheme["--w-rjv-info-color"] = "hsl(var(--text-muted-foreground))";
    // @ts-expect-error hacky way to just quickly change the border color
    nordTheme["--w-rjv-line-color"] = "hsl(var(--border))";

    return (
      <JsonView
        value={json}
        style={nordTheme}
        displayDataTypes={false}
        collapsed={collapsed}
      />
    );
  } catch (error) {
    return (
      <ResponseBodyText
        body={text}
        maxPreviewLength={textMaxPreviewLength}
        maxPreviewLines={textMaxPreviewLines}
      />
    );
  }
}
