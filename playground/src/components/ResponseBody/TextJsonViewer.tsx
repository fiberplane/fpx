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
    // @ts-expect-error hacky way to just quickly change the curly braces color
    nordTheme["--w-rjv-curlybraces-color"] = "hsl(var(--info) / 0.8)";
    // @ts-expect-error hacky way to just quickly change the value of brackets text
    nordTheme["--w-rjv-brackets-color"] = "hsl(var(--info) / 0.8)";
    // @ts-expect-error hacky way to just quickly change the info text color
    nordTheme["--w-rjv-info-color"] = "hsl(var(--text-muted-foreground))";
    // @ts-expect-error hacky way to just quickly change the border color
    nordTheme["--w-rjv-line-color"] = "hsl(var(--border))";
    // @ts-expect-error hacky way to just quickly change the key string color
    nordTheme["--w-rjv-key-string"] = "hsl(var(--info))";
    // @ts-expect-error hacky way to just quickly change the type string color
    nordTheme["--w-rjv-type-string-color"] = "hsl(var(--success))";
    // @ts-expect-error hacky way to just quickly change the value boolean color
    nordTheme["--w-rjv-type-boolean-color"] = "hsl(var(--warning))";
    // @ts-expect-error hacky way to just quickly change the value int color
    nordTheme["--w-rjv-type-int-color"] = "hsl(var(--foreground) / 0.9)";
    // @ts-expect-error hacky way to just quickly change the value of info text
    nordTheme["--w-rjv-info-color"] = "hsl(var(--foreground) / 0.6)";
    // @ts-expect-error hacky way to just quickly change the value of ellipsis text
    nordTheme["--w-rjv-ellipsis-color"] = "hsl(var(--primary) / 0.6)";

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
