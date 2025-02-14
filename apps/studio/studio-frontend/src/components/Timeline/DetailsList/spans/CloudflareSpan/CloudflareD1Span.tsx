import { CodeMirrorSqlEditor } from "@/components/CodeMirrorEditor";
import { CF_BINDING_ERROR, CF_BINDING_RESULT } from "@/constants";
import { type CloudflareD1VendorInfo, getString, noop } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { CollapsibleSubSection } from "../../../shared";
import { CfResultAndError } from "./shared";

type Props = {
  vendorInfo: CloudflareD1VendorInfo;
  metadata: React.ReactNode;
} & Pick<OtelSpan, "attributes">;

/**
 * The D1 span is rendered a little differently.
 * We ignore the exact method that was called on the binding,
 * and instead just opt to render the query and result.
 */
export function CloudflareD1Span({ attributes, vendorInfo, metadata }: Props) {
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

  const result = getString(attributes[CF_BINDING_RESULT]);
  const error = getString(attributes[CF_BINDING_ERROR]);

  return (
    <div className="text-xs py-2 space-y-2">
      <CollapsibleSubSection heading="SQL Query" defaultCollapsed={false}>
        <CodeMirrorSqlEditor
          value={queryValue}
          onChange={noop}
          readOnly={true}
        />
      </CollapsibleSubSection>
      <CfResultAndError result={result} error={error} />
      <CollapsibleSubSection heading="Span Metadata" defaultCollapsed={true}>
        {metadata}
      </CollapsibleSubSection>
    </div>
  );
}
