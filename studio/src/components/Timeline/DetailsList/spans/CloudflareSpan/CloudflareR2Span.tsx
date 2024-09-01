import { Badge } from "@/components/ui/badge";
import { CF_BINDING_METHOD, CF_BINDING_RESULT } from "@/constants";
import type { OtelSpan } from "@/queries";
import { getString } from "@/utils";
import { useMemo } from "react";
import { CollapsibleSubSection } from "../../../shared";
import { TextOrJsonViewer } from "../../TextJsonViewer";
import { CfBindingOverview } from "./shared";

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
export function CloudflareR2Span({ span }: { span: OtelSpan }) {
  const method = getString(span.attributes[CF_BINDING_METHOD]);
  const args = getString(span.attributes.args);
  const r2Args = useCloudflareR2Args(args, method);
  const result = getString(span.attributes[CF_BINDING_RESULT]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview span={span}>
        {r2Args.key ? (
          <Badge className="text-xs gap-2" variant="secondary">
            <span className="font-mono text-muted-foreground uppercase pr-2 border-r border-gray-500">
              Key
            </span>
            {r2Args.key}
          </Badge>
        ) : null}
      </CfBindingOverview>
      <div className="text-xs py-2 space-y-2">
        {r2Args.options && (
          <CollapsibleSubSection heading="Options">
            <CloudflareR2Args args={r2Args.options} />
          </CollapsibleSubSection>
        )}
        <CollapsibleSubSection heading="Result">
          <TextOrJsonViewer text={result} collapsed={true} />
        </CollapsibleSubSection>
      </div>
    </div>
  );
}

function CloudflareR2Args({ args }: { args: string }) {
  return <TextOrJsonViewer text={args} collapsed={true} />;
}

function useCloudflareR2Args(args: string, method: string) {
  return useMemo(() => {
    try {
      const parsedArgs = JSON.parse(args);
      switch (method) {
        case "put":
          return {
            key: parsedArgs?.[0] ? String(parsedArgs?.[0]) : "",
            value: parsedArgs?.[1] ? String(parsedArgs?.[1]) : "",
            options: parsedArgs?.[2]
              ? JSON.stringify(parsedArgs?.[2])
              : undefined,
          };
        case "get":
        case "delete":
        case "createMultipartUpload":
        case "resumeMultipartUpload":
          return {
            key: parsedArgs?.[0] ? String(parsedArgs?.[0]) : "",
            options: parsedArgs?.[1]
              ? JSON.stringify(parsedArgs?.[1])
              : undefined,
          };
        case "head":
          return {
            key: parsedArgs?.[0] ? String(parsedArgs?.[0]) : "",
          };
        case "list":
          return {
            options: parsedArgs?.[0]
              ? JSON.stringify(parsedArgs?.[0])
              : undefined,
          };
        default:
          return {};
      }
    } catch (e) {
      return {};
    }
  }, [args, method]);
}
