import { getHttpMethodTextColor } from "@/pages/RequestorPage/method";
import { MizuRootRequestSpan } from "@/queries/traces-v2";
import { cn } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { SectionHeading } from "../shared";

const SubSectionHeading = ({ children }: { children: React.ReactNode }) => {
  return <div className="font-semibold text-sm">{children}</div>;
};

export function IncomingRequest({ span }: { span: MizuRootRequestSpan }) {
  const method = span.attributes["http.method"] as string;
  const matchedRoute = span.attributes["fpx.matched_route"] as string;
  const duration = useMemo(() => {
    try {
      const duration =
        new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
      return duration;
    } catch (e) {
      return null;
    }
  }, [span]);
  return (
    <div>
      <div className="flex flex-col gap-2">
        <SectionHeading>Incoming Request</SectionHeading>
        <div className="flex gap-2">
          <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
            <span className={cn(getHttpMethodTextColor(method))}>{method}</span>
            <span className="text-gray-400 font-light">{matchedRoute}</span>
          </div>
          <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
            <ClockIcon className="w-4 h-4" />
            <span className=" font-light">{duration}ms</span>
          </div>
        </div>
        <div>
          <SubSectionHeading>Request Headers</SubSectionHeading>
        </div>
        <div>
          <SubSectionHeading>Response Headers</SubSectionHeading>
        </div>
        <div>
          <SubSectionHeading>Request Body</SubSectionHeading>
        </div>
        <div>
          <SubSectionHeading>Response Body</SubSectionHeading>
        </div>
      </div>
    </div>
  );
}
