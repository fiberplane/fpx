import { SubSectionHeading } from "@/components/SubSectionHeading";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn, safeParseJson } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import {
  type RequestorActiveResponse,
  isRequestorActiveResponse,
} from "../../store/types";
import { FailedRequest } from "./FailedRequest";
import { ResponseBodyBinary } from "./ResponseBodyBinary";
import { ResponseBodyText } from "./ResponseBodyText";
import { TextOrJsonViewer } from "./TextJsonViewer";

export function ResponseBody({
  response,
  className,
}: {
  response?: RequestorActiveResponse;
  className?: string;
}) {
  const isFailure = response?.isFailure;

  // This means we couldn't even contact the service
  if (isFailure) {
    return <FailedRequest response={response} />;
  }

  // NOTE - This means we have the *actual* response from the service in the store,
  //        which may contain binary data that we can render in the UI.
  //        This is different from history responses, which will only have whatever data was stored in the trace
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
          <ResponseBodyText
            body={body.value}
            className={className}
            defaultExpanded
            minHeight="0"
          />
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

  // TODO - if response is empty, show that in a ux friendly way, with 204 for example
  return (
    <div className={cn("overflow-hidden overflow-y-auto w-full", className)}>
      <ResponseBodyText
        body={""}
        className={className}
        defaultExpanded
        minHeight="0"
      />
    </div>
  );
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
