import { CodeMirrorJsonEditor } from "@/components/CodeMirrorEditor";
import { SubSectionHeading } from "@/components/Timeline";
import { TextOrJsonViewer } from "@/components/Timeline/DetailsList/TextJsonViewer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn, isJson, noop, safeParseJson } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import type { ProxiedRequestResponse } from "../../queries";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../../store/types";
import { FailedRequest } from "./FailedRequest";
import { ResponseBodyBinary } from "./ResponseBodyBinary";
import { ResponseBodyText } from "./ResponseBodyText";

export function ResponseBody({
  response,
  className,
}: {
  response?: ProxiedRequestResponse | RequestorActiveResponse;
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
          <ResponseBodyText body={body.value} className={className} />
        </div>
      );
    }

    if (body?.type === "json") {
      const prettyBody = JSON.stringify(safeParseJson(body.value), null, 2);

      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          <TextOrJsonViewer text={prettyBody} collapsed={false} />
        </div>
      );
    }

    if (body?.type === "binary") {
      return (
        <div
          className={cn("overflow-hidden overflow-y-auto w-full", className)}
        >
          <CollapsibleBodyContainer>
            <ResponseBodyBinary body={body} />
          </CollapsibleBodyContainer>
        </div>
      );
    }

    // TODO - Stylize
    if (body?.type === "unknown") {
      return <UnknownResponse className={className} />;
    }

    return <UnknownResponse className={className} />;
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
          <CodeMirrorJsonEditor
            value={prettyBody}
            readOnly
            onChange={noop}
            minHeight="0"
          />
        </div>
      );
    }

    // For text responses, just split into lines and render with rudimentary line numbers
    // TODO - if response is empty, show that in a ux friendly way, with 204 for example

    return (
      <div className={cn("overflow-hidden overflow-y-auto w-full", className)}>
        <ResponseBodyText body={body ?? ""} className={className} />
      </div>
    );
  }
}

function UnknownResponse({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden overflow-y-auto w-full", className)}>
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
