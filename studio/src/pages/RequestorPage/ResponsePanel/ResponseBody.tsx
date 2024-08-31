import { CodeMirrorJsonEditor, SubSectionHeading } from "@/components/Timeline";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn, isJson, noop, safeParseJson } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  LinkBreak2Icon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import type { Requestornator } from "../queries";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../reducer/state";

export function ResponseBody({
  headersSlot,
  response,
  className,
}: {
  headersSlot?: React.ReactNode;
  response?: Requestornator | RequestorActiveResponse;
  className?: string;
}) {
  const isFailure = isRequestorActiveResponse(response)
    ? response?.isFailure
    : response?.app_responses?.isFailure;

  // This means we couldn't even contact the service
  if (isFailure) {
    return <FailedRequest response={response} />;
  }

  if (isRequestorActiveResponse(response)) {
    const body = response?.responseBody;
    if (body?.type === "error") {
      return <FailedRequest response={response} />;
    }

    if (body?.type === "text" || body?.type === "html") {
      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          {headersSlot}
          <CollapsibleBodyContainer>
            <ResponseBodyText body={body.value} className={className} />
          </CollapsibleBodyContainer>
        </div>
      );
    }

    if (body?.type === "json") {
      const prettyBody = JSON.stringify(safeParseJson(body.value), null, 2);

      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          {headersSlot}
          <CollapsibleBodyContainer>
            <CodeMirrorJsonEditor
              value={prettyBody}
              readOnly
              onChange={noop}
              minHeight="0"
            />
          </CollapsibleBodyContainer>
        </div>
      );
    }

    // TODO
    if (body?.type === "binary") {
      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          {headersSlot}
          <CollapsibleBodyContainer>
            <ResponseBodyBinary body={body} />
          </CollapsibleBodyContainer>
        </div>
      );
    }

    // TODO - Stylize
    if (body?.type === "unknown") {
      return (
        <UnknownResponse headersSlot={headersSlot} className={className} />
      );
    }

    return <UnknownResponse headersSlot={headersSlot} className={className} />;
  }

  if (!isRequestorActiveResponse(response)) {
    const body = response?.app_responses?.responseBody;

    // Special rendering for JSON
    if (body && isJson(body)) {
      const prettyBody = JSON.stringify(JSON.parse(body), null, 2);

      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          {headersSlot}
          <CollapsibleBodyContainer>
            <CodeMirrorJsonEditor value={prettyBody} readOnly onChange={noop} />
          </CollapsibleBodyContainer>
        </div>
      );
    }

    // For text responses, just split into lines and render with rudimentary line numbers
    // TODO - if response is empty, show that in a ux friendly way, with 204 for example

    return (
      <div className={cn("overflow-hidden overflow-y-auto w-full", className)}>
        {headersSlot}
        <CollapsibleBodyContainer>
          <ResponseBodyText body={body ?? ""} className={className} />
        </CollapsibleBodyContainer>
      </div>
    );
  }
}

function UnknownResponse({
  className,
  headersSlot,
}: {
  headersSlot: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden overflow-y-auto w-full", className)}>
      {headersSlot}
      <CollapsibleBodyContainer>
        <div className="text-gray-400 py-20 flex flex-col items-center justify-center gap-4">
          <QuestionMarkIcon className="h-8 w-8" />
          <span className="text-gray-200 italic">
            Unknown response type, cannot render body
          </span>
        </div>
      </CollapsibleBodyContainer>
    </div>
  );
}

function ResponseBodyBinary({
  body,
}: {
  body: { contentType: string; type: "binary"; value: ArrayBuffer };
}) {
  const isImage = body.contentType.startsWith("image/");

  if (isImage) {
    const blob = new Blob([body.value], { type: body.contentType });
    const imageUrl = URL.createObjectURL(blob);
    return (
      <img
        src={imageUrl}
        alt="Response"
        className="max-w-full h-auto"
        onLoad={() => URL.revokeObjectURL(imageUrl)}
      />
    );
  }

  // TODO - Stylize
  return <div>Binary response {body.contentType}</div>;
}

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

export function FailedRequest({
  response,
}: { response?: Requestornator | RequestorActiveResponse }) {
  // TODO - Show a more friendly error message
  const failureReason = isRequestorActiveResponse(response)
    ? null
    : response?.app_responses?.failureReason;
  const friendlyMessage =
    failureReason === "fetch failed" ? "Service unreachable" : null;
  // const failureDetails = response?.app_responses?.failureDetails;
  return (
    <div className="h-full pb-8 sm:pb-20 md:pb-32 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          {friendlyMessage
            ? `Request failed: ${friendlyMessage}`
            : "Request failed"}
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Make sure your api is up and has FPX Middleware enabled!
        </div>
      </div>
    </div>
  );
}

function CollapsibleBodyContainer({
  className,
  defaultCollapsed = false,
  title = "Body",
  children,
}: {
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const toggleIsOpen = () => setIsOpen((o) => !o);

  return (
    <div className={cn(className, "border-t", "pt-2")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SubSectionHeading
            className="flex items-center gap-2"
            onClick={toggleIsOpen}
          >
            {isOpen ? (
              <CaretDownIcon className="w-4 h-4 cursor-pointer" />
            ) : (
              <CaretRightIcon className="w-4 h-4 cursor-pointer" />
            )}
            {title}
          </SubSectionHeading>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
      </Collapsible>
    </div>
  );
}
