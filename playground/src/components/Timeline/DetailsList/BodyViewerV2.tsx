import { TextOrJsonViewer } from "@/components/ResponseBody";
import { useMemo } from "react";

export function BodyViewerV2({
  body,
  contentType,
  collapsed,
  textMaxPreviewLines,
}: {
  body: string;
  contentType?: string;
  collapsed?: boolean;
  textMaxPreviewLines?: number | null;
}) {
  if (contentType?.includes("multipart/form-data")) {
    return <FormDataViewer body={body} />;
  }

  return (
    <TextOrJsonViewer
      text={body}
      collapsed={collapsed}
      textMaxPreviewLines={textMaxPreviewLines}
    />
  );
}

function FormDataViewer({ body }: { body: string }) {
  const formData = useMemo(() => {
    try {
      const parsedBody = JSON.parse(body);
      if (parsedBody && typeof parsedBody === "object") {
        const formDataString = Object.entries(parsedBody)
          .map(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              // Handle nested objects or arrays
              // NOTE - This will break on a circular JSON object, but this input should never be circular
              return `${key}=${JSON.stringify(value)}`;
            }
            return `${key}=${value}`;
          })
          .join("\n");
        return formDataString;
      }
      return body;
    } catch (e) {
      return body;
    }
  }, [body]);
  return <TextOrJsonViewer text={formData} />;
}
