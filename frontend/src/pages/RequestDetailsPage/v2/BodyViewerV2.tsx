import { useMemo } from "react";
import { TextOrJsonViewer } from "../TextJsonViewer";

export function BodyViewerV2({
  body,
  contentType,
}: { body: string; contentType?: string }) {
  if (contentType?.includes("multipart/form-data")) {
    return <FormDataViewer body={body} />;
  }

  return <TextOrJsonViewer text={body} />;
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
