import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useMemo, useState } from "react";

export function ResponseBodyText({
  body,
  maxPreviewLength = null,
  maxPreviewLines = null,
  defaultExpanded = false,
  className,
}: {
  body: string;
  maxPreviewLength?: number | null;
  maxPreviewLines?: number | null;
  defaultExpanded?: boolean;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);
  const toggleIsExpanded = () => setIsExpanded((e) => !e);

  // For text responses, just split into lines and render with rudimentary line numbers
  const { lines, hiddenLinesCount, hiddenCharsCount, shouldShowExpandButton } =
    useTextPreview(body, isExpanded, maxPreviewLength, maxPreviewLines);

  // TODO - if response is empty, show that in a ux friendly way, with 204 for example

  return (
    <div
      className={cn("overflow-hidden overflow-y-auto w-full py-2", className)}
    >
      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
        <code className="h-full">{lines}</code>
      </pre>
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

    // If we're not expanded, we want to show a preview of the body depending on the maxPreviewLength
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

    const lines = (isExpanded ? body : previewBody)
      ?.split("\n")
      ?.map((line, index) => (
        <div key={index} className="flex h-full">
          <span className="w-8 text-right pr-2 text-gray-500 bg-muted mr-1">
            {index + 1}
          </span>
          <span>{line}</span>
        </div>
      ));

    return {
      lines,
      shouldShowExpandButton: exceedsMaxPreviewLength || exceedsMaxPreviewLines,
      hiddenLinesCount,
      hiddenCharsCount,
    };
  }, [body, maxPreviewLines, maxPreviewLength, isExpanded]);
}
