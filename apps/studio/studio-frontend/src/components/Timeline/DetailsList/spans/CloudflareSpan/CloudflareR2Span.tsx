import {
  CF_BINDING_ERROR,
  CF_BINDING_METHOD,
  CF_BINDING_RESULT,
} from "@/constants";
import { getString } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { CollapsibleSubSection } from "../../../shared";
import { TextOrJsonViewer } from "../../TextJsonViewer";
import { CfBindingOverview, CfResultAndError, KeyBadge } from "./shared";

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
export function CloudflareR2Span({
  attributes,
  metadata,
}: {
  attributes: OtelSpan["attributes"];
  metadata: React.ReactNode;
}) {
  const method = getString(attributes[CF_BINDING_METHOD]);
  const args = getString(attributes.args);
  const r2Args = useCloudflareR2Args(args, method);
  const result = getString(attributes[CF_BINDING_RESULT]);
  const error = getString(attributes[CF_BINDING_ERROR]);
  return (
    <div className="text-xs py-2">
      <CfBindingOverview attributes={attributes}>
        {r2Args.key ? <KeyBadge keyName={r2Args.key} /> : null}
      </CfBindingOverview>
      <div className="text-xs py-2 space-y-2">
        {r2Args.options && (
          <CollapsibleSubSection heading="Options">
            <CloudflareR2Args args={r2Args.options} />
          </CollapsibleSubSection>
        )}
        <CfResultAndError result={result} error={error} />
        <CollapsibleSubSection heading="Span Metadata" defaultCollapsed={true}>
          {metadata}
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
