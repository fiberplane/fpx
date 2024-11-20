import { CodeMirrorTextEditor } from "@/components/CodeMirrorEditor/CodeMirrorTextEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useMemo, useState } from "react";

export function ResponseBodyText({
  body,
  maxPreviewLength = null,
  maxPreviewLines = null,
  defaultExpanded = false,
  className,
  minHeight = "100px",
}: {
  body: string;
  maxPreviewLength?: number | null;
  maxPreviewLines?: number | null;
  defaultExpanded?: boolean;
  className?: string;
  minHeight?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);
  const toggleIsExpanded = () => setIsExpanded((e) => !e);

  const {
    previewBody,
    hiddenLinesCount,
    hiddenCharsCount,
    shouldShowExpandButton,
  } = useTextPreview(body, isExpanded, maxPreviewLength, maxPreviewLines);

  return (
    <div className={cn("w-full", className)}>
      <CodeMirrorTextEditor
        value={isExpanded ? body : previewBody}
        readOnly={true}
        onChange={() => {}}
        minHeight={minHeight}
        maxHeight={isExpanded ? "800px" : "300px"}
      />

      {shouldShowExpandButton && (
        <div
          className={cn(
            "w-full flex flex-row items-center gap-2 mt-4 border-t border-gray-500/50",
          )}
        >
          {!isExpanded && (
            <div className="text-sm text-gray-400">
              {hiddenLinesCount > 0 ? (
                <>{hiddenLinesCount} lines hidden</>
              ) : (
                <>{hiddenCharsCount} characters hidden</>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={toggleIsExpanded}
            className="text-blue-400 font-normal py-1 px-1 hover:bg-transparent hover:text-blue-400 hover:underline"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        </div>
      )}
    </div>
  );
}

function useTextPreview(
  body: string,
  isExpanded: boolean,
  maxPreviewLength: number | null,
  maxPreviewLines: number | null,
) {
  return useMemo(() => {
    let hiddenCharsCount = 0;
    let hiddenLinesCount = 0;
    const allLinesCount = body.split("\n")?.length;

    const exceedsMaxPreviewLength = maxPreviewLength
      ? body.length > maxPreviewLength
      : false;

    const exceedsMaxPreviewLines = maxPreviewLines
      ? allLinesCount > maxPreviewLines
      : false;

    // If we're not expanded, we want to show a preview of the body
    let previewBody = body;
    if (maxPreviewLength && exceedsMaxPreviewLength && !isExpanded) {
      previewBody = body ? `${body.slice(0, maxPreviewLength)}...` : "";
      hiddenCharsCount = body.length - maxPreviewLength;
    }

    let previewLines = previewBody?.split("\n");
    if (
      maxPreviewLines &&
      !isExpanded &&
      previewLines.length > maxPreviewLines
    ) {
      previewLines = previewLines.slice(0, maxPreviewLines);
      previewBody = `${previewLines.join("\n")}...`;
      hiddenLinesCount = allLinesCount - previewLines.length;
    }

    return {
      previewBody,
      shouldShowExpandButton: exceedsMaxPreviewLength || exceedsMaxPreviewLines,
      hiddenLinesCount,
      hiddenCharsCount,
    };
  }, [body, maxPreviewLines, maxPreviewLength, isExpanded]);
}
