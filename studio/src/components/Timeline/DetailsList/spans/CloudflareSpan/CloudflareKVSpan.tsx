import { CF_BINDING_METHOD, CF_BINDING_RESULT } from "@/constants";
import type { OtelSpan } from "@/queries";
import { getString } from "@/utils";
import { useMemo } from "react";
import { CollapsibleSubSection } from "../../../shared";
import { KeyValueTable } from "../../KeyValueTableV2";
import { TextOrJsonViewer } from "../../TextJsonViewer";
import { CfBindingOverview, KeyBadge } from "./shared";

/**
 * Cloudflare KV has the following methods:
 * - get
 * - put
 * - delete
 *
 * https://github.com/cloudflare/workers-sdk/blob/c4f0d9e01ef333f5882096ad1e0f37e0911089a7/templates/experimental/worker-scala-kv/src/main/scala/Globals.scala#L9
 */
export function CloudflareKVSpan({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  const args = getString(span.attributes.args);
  const kvArgs = useCloudflareKVArgs(args, method);
  const result = getString(span.attributes[CF_BINDING_RESULT]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview span={span}>
        {kvArgs.key ? <KeyBadge keyName={kvArgs.key} /> : null}
      </CfBindingOverview>
      <div className="text-xs py-2 space-y-2">
        {kvArgs?.value ? (
          <CollapsibleSubSection heading="Args" defaultCollapsed={true}>
            <div className="pl-6 mt-1">
              <CloudflareKVTable kvArgs={kvArgs} />
            </div>
          </CollapsibleSubSection>
        ) : null}
        <CollapsibleSubSection heading="Result" defaultCollapsed={true}>
          <div className="pl-6 mt-1">
            <TextOrJsonViewer text={result} collapsed={true} />
          </div>
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

function CloudflareKVTable({ kvArgs }: { kvArgs: Record<string, string> }) {
  return (
    <KeyValueTable
      keyValue={kvArgs}
      valueCellClassName="text-xs"
      keyCellClassName="w-12 min-w-0 lg:min-w-0"
    />
  );
}

function useCloudflareKVArgs(args: string, method: string) {
  return useMemo(() => {
    try {
      const parsedArgs = JSON.parse(args);
      const result: Record<string, string> = {};
      switch (method) {
        case "put":
          result.key = parsedArgs?.[0] ? String(parsedArgs?.[0]) : "";
          result.value = parsedArgs?.[1] ? String(parsedArgs?.[1]) : "";
          break;
        case "get":
        case "delete":
          result.key = parsedArgs?.[0] ? String(parsedArgs?.[0]) : "";
          break;
      }
      return result;
    } catch (e) {
      return {};
    }
  }, [args, method]);
}
