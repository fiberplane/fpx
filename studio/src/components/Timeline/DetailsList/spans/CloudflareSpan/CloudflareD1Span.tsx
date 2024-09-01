import { CF_BINDING_RESULT } from "@/constants";
import type { OtelSpan } from "@/queries";
import { type CloudflareD1VendorInfo, getString, noop } from "@/utils";
import { useMemo } from "react";
import { format } from "sql-formatter";
import { CollapsibleSubSection } from "../../../shared";
import { CodeMirrorSqlEditor } from "../../CodeMirrorEditor";
import { TextOrJsonViewer } from "../../TextJsonViewer";

/**
 * The D1 span is rendered a little differently.
 * We ignore the exact method that was called on the binding,
 * and instead just opt to render the query and result.
 */
export function CloudflareD1Span({
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
