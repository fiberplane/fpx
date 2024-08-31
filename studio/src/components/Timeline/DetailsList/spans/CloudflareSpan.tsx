import { Badge } from "@/components/ui/badge";
import {
  CF_BINDING_METHOD,
  CF_BINDING_NAME,
  CF_BINDING_RESULT,
} from "@/constants";
import type { OtelSpan } from "@/queries";
import {
  type CloudflareD1VendorInfo,
  type CloudflareVendorInfo,
  getString,
  isCloudflareD1VendorInfo,
  noop,
} from "@/utils";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { CollapsibleSubSection } from "../../shared";
import { CodeMirrorSqlEditor } from "../CodeMirrorEditor";
import { KeyValueTable } from "../KeyValueTableV2";
import { TextOrJsonViewer } from "../TextJsonViewer";

export function CloudflareSpan({
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

/**
 * The D1 span is rendered a little differently.
 * We ignore the exact method that was called on the binding,
 * and instead just opt to render the query and result.
 */
function CloudflareD1Span({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: CloudflareD1VendorInfo }) {
  const queryValue = useMemo(() => {
    try {
      return format(vendorInfo.sql.query, {
        language: "sqlite",
        params: vendorInfo.sql.params ?? [],
      });
    } catch (_e) {
      // Being very defensive
      return vendorInfo?.sql?.query ?? "";
    }
  }, [vendorInfo]);

  const result = getString(span.attributes[CF_BINDING_RESULT]);

  return (
    <div className="text-xs py-2 space-y-2">
      <CollapsibleSubSection heading="SQL Query" defaultCollapsed={false}>
        <CodeMirrorSqlEditor
          value={queryValue}
          onChange={noop}
          readOnly={true}
        />
      </CollapsibleSubSection>
      <CollapsibleSubSection heading="Result" defaultCollapsed={true}>
        <TextOrJsonViewer text={result} collapsed={true} />
      </CollapsibleSubSection>
    </div>
  );
}

/**
 * Cloudflare KV has the following methods:
 * - get
 * - put
 * - delete
 *
 * https://github.com/cloudflare/workers-sdk/blob/c4f0d9e01ef333f5882096ad1e0f37e0911089a7/templates/experimental/worker-scala-kv/src/main/scala/Globals.scala#L9
 */
function CloudflareKVSpan({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  const args = getString(span.attributes.args);
  const result = getString(span.attributes[CF_BINDING_RESULT]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview span={span} />
      <div className="text-xs py-2 space-y-2">
        <CollapsibleSubSection heading="Args" defaultCollapsed={true}>
          <div className="pl-6 mt-1">
            <CloudflareKVArgs method={method} args={args} />
          </div>
        </CollapsibleSubSection>
        <CollapsibleSubSection heading="Result" defaultCollapsed={true}>
          <div className="pl-6 mt-1">
            <TextOrJsonViewer text={result} collapsed={true} />
          </div>
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

function CloudflareKVArgs({ method, args }: { method: string; args: string }) {
  const argsObj = useMemo(() => {
    try {
      const parsedArgs = JSON.parse(args);
      const result: Record<string, string> = {};
      if (method === "put") {
        result.key = parsedArgs?.[0] ? String(parsedArgs?.[0]) : "";
        result.value = parsedArgs?.[1] ? String(parsedArgs?.[1]) : "";
      }
      if (method === "get" || method === "delete") {
        result.key = parsedArgs?.[0] ? String(parsedArgs?.[0]) : "";
      }
      return result;
    } catch (e) {
      return {};
    }
  }, [args, method]);

  if (method === "get") {
    return <CloudflareKVTable argsObj={argsObj} />;
  }

  if (method === "put") {
    return <CloudflareKVTable argsObj={argsObj} />;
  }
  if (method === "delete") {
    return <CloudflareKVTable argsObj={argsObj} />;
  }
  return <TextOrJsonViewer text={args} collapsed={true} />;
}

function CloudflareKVTable({ argsObj }: { argsObj: Record<string, string> }) {
  return (
    <KeyValueTable
      keyValue={argsObj}
      valueCellClassName="text-xs"
      keyCellClassName="w-12 min-w-0 lg:min-w-0"
    />
  );
}

/**
 * Cloudflare R2 has the following methods:
 *
 * - get
 * - put
 * - delete
 * - list
 * - head
 * - createMultipartUpload
 * - resumeMultipartUpload
 *
 * https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#bucket-method-definitions
 */
function CloudflareR2Span({ span }: { span: OtelSpan }) {
  const result = getString(span.attributes[CF_BINDING_RESULT]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview span={span} />
      <div className="text-xs py-2 space-y-2">
        <CollapsibleSubSection heading="Result">
          <TextOrJsonViewer text={result} collapsed={true} />
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

/**
 * We care mostly about the `run` method
 */
function CloudflareAISpan({ span }: { span: OtelSpan }) {
  const result = getString(span.attributes[CF_BINDING_RESULT]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview span={span} />
      <div className="text-xs py-2 space-y-2">
        <CollapsibleSubSection heading="Result">
          <TextOrJsonViewer text={result} collapsed={true} />
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

function CfBindingOverview({ span }: { span: OtelSpan }) {
  const bindingName = getString(span.attributes[CF_BINDING_NAME]);
  const method = getString(span.attributes[CF_BINDING_METHOD]);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <Badge variant="secondary" className="font-mono font-light text-gray-300">
        {bindingName}.{method}
      </Badge>
    </div>
  );
}
