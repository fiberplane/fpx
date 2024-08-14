import { CodeMirrorSqlEditor } from "@/pages/RequestorPage/Editors/CodeMirrorEditor";
import { OtelSpan } from "@/queries";
import { SENSITIVE_HEADERS, cn, noop } from "@/utils";
import { ClockIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { SectionHeading } from "../shared";
import { CollapsibleKeyValueTableV2 } from "./KeyValueTableV2";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestMethod,
  getRequestUrl,
  getResponseBody,
  getResponseHeaders,
} from "./otel-helpers";
import { Divider, SubSection, SubSectionHeading } from "./shared";
import {
  PostgresVendorInfo,
} from "./vendorify-traces";

export function PostgresSpan({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: PostgresVendorInfo }) {
  const id = span.span_id;

  const duration = useMemo(() => {
    try {
      const duration =
        new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
      return duration;
    } catch (e) {
      return null;
    }
  }, [span]);

  const url = getRequestUrl(span);

  return (
    <div id={id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>Supabase</SectionHeading>
          <div className="flex gap-2">
            <div className="inline-flex gap-2 font-mono py-1 px-2 text-xs bg-accent/80 rounded">
              <span className={cn("uppercase", "text-green-500")}>
                OK
              </span>
              {url}
            </div>
            <div className="inline-flex gap-2 font-mono text-gray-400 py-1 px-2 text-xs bg-accent/80 rounded">
              <ClockIcon className="w-4 h-4" />
              <span className="font-light">{duration}ms</span>
            </div>
          </div>
        </div>

        <PostgresSection vendorInfo={vendorInfo} />

        <Divider />


      </div>
    </div>

  );
}

function PostgresSection({ vendorInfo }: { vendorInfo: PostgresVendorInfo }) {
  const queryValue = useMemo(() => {
    console.log("vendorInfo", vendorInfo);
    try {
      const paramsFromSupa = safeParseJson(vendorInfo.sql.params) ?? [];
      console.log("paramsFromSupa", paramsFromSupa);
      // NOTE - sql-formatter expects the index in the array to match the `$nr` syntax from postgres
      //        this makes the 0th index unused, but it makes the rest of the indices match the `$1`, `$2`, etc.
      const params = ["", ...paramsFromSupa].map(p => p?.toString() ?? "");

      return format(vendorInfo.sql.query, {
        language: "postgresql",
        params
      });
    } catch (e) {
      // Being very defensive soz
      return vendorInfo?.sql?.query ?? "";
    }
  }, [vendorInfo]);
  return (
    <SubSection>
      <SubSectionHeading>SQL Query</SubSectionHeading>
      <CodeMirrorSqlEditor value={queryValue} onChange={noop} readOnly={true} />
    </SubSection>
  );
}

function safeParseJson(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
