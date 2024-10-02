import { type NeonVendorInfo, noop } from "@/utils";
import { useFormattedNeonQuery } from "./hooks";
import { SubSection, SubSectionHeading } from "@/components/Timeline/shared";
import { CodeMirrorSqlEditor } from "@/components/CodeMirrorEditor";

export function NeonSection({ vendorInfo }: { vendorInfo: NeonVendorInfo }) {
  const queryValue = useFormattedNeonQuery(vendorInfo?.sql);
  return (
    <SubSection>
      <SubSectionHeading>SQL Query</SubSectionHeading>
      <CodeMirrorSqlEditor value={queryValue} onChange={noop} readOnly={true} />
    </SubSection>
  );
}
