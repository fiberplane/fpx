import { Badge } from "@/components/ui/badge";
import { CF_BINDING_METHOD, SpanStatus } from "@/constants";
import type { OtelSpan } from "@/queries";
import {
  type CloudflareD1VendorInfo,
  type CloudflareVendorInfo,
  type VendorInfo,
  getNumber,
  getString,
  isCloudflareD1VendorInfo,
  isCloudflareVendorInfo,
  noop,
} from "@/utils";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { useTimelineIcon } from "../../hooks";
import { SectionHeading } from "../../shared";
import { SubSection, SubSectionHeading } from "../../shared";
import { formatDuration } from "../../utils";
import { CodeMirrorSqlEditor } from "../CodeMirrorEditor";
import { KeyValueTable } from "../KeyValueTableV2";

export function GenericSpan({
  span,
  vendorInfo,
}: {
  span: OtelSpan;
  vendorInfo: VendorInfo;
}) {
  const attributes = useMemo(() => {
    const attr: Record<string, string> = {};
    for (const key of Object.keys(span.attributes)) {
      const value = span.attributes[key];
      const isString = typeof value === "string";
      const isObject = !!value && typeof value === "object";
      if (isString || (isObject && "String" in value)) {
        attr[key] = getString(value);
      } else {
        attr[key] = getNumber(value).toString();
      }
    }
    return attr;
  }, [span]);
  const icon = useTimelineIcon(span, { vendorInfo });
  return (
    <div id={span.span_id}>
      <SectionHeading className="grid gap-2 grid-cols-[auto_1fr] items-center">
        {icon}
        <div className="flex items-center gap-2 max-w-full">
          {span.name}
          {span.status?.code === SpanStatus.ERROR && (
            <>
              &nbsp;
              <Badge className="ml-2 mr-2" variant={"destructive"}>
                Error
              </Badge>
            </>
          )}
          <div className="text-gray-400 text-xs w-12 px-2">
            {formatDuration(span.start_time, span.end_time)}
          </div>
        </div>
      </SectionHeading>
      {isCloudflareVendorInfo(vendorInfo) && (
        <CloudflareSpan span={span} vendorInfo={vendorInfo} />
      )}
      {Object.keys(attributes).length > 0 && (
        <SubSection>
          <SubSectionHeading>Attributes</SubSectionHeading>
          <KeyValueTable keyValue={attributes} />
        </SubSection>
      )}
    </div>
  );
}

function CloudflareSpan({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: CloudflareVendorInfo }) {
  if (isCloudflareD1VendorInfo(vendorInfo)) {
    return <CloudflareD1Span span={span} vendorInfo={vendorInfo} />;
  }
  if (vendorInfo.type === "r2") {
    return <CloudflareR2Span span={span} />;
  }
  if (vendorInfo.type === "ai") {
    return <CloudflareAISpan span={span} />;
  }
  if (vendorInfo.type === "kv") {
    return <CloudflareKVSpan span={span} />;
  }

  return null;
}

function CloudflareD1Span({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: CloudflareD1VendorInfo }) {
  const queryValue = useMemo(() => {
    try {
      const paramsFromD1 = vendorInfo.sql.params ?? [];
      const params = [...paramsFromD1];
      return format(vendorInfo.sql.query, {
        language: "sqlite",
        params,
      });
    } catch (e) {
      // Being very defensive soz
      return vendorInfo?.sql?.query ?? "";
    }
  }, [vendorInfo]);
  return (
    <div className="text-xs py-2">
      <SubSection>
        <SubSectionHeading>SQL Query</SubSectionHeading>
        <CodeMirrorSqlEditor
          value={queryValue}
          onChange={noop}
          readOnly={true}
        />
      </SubSection>
    </div>
  );
}

function CloudflareKVSpan({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  return (
    <div className="text-xs py-2">
      Cloudflare KV <code>{method}</code>
    </div>
  );
}

function CloudflareR2Span({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  return (
    <div className="text-xs py-2">
      Cloudflare R2 <code>{method}</code>
    </div>
  );
}

function CloudflareAISpan({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  return (
    <div className="text-xs py-2">
      Cloudflare AI <code>{method}</code>
    </div>
  );
}
