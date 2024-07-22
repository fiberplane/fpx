import { MizuFetchSpan } from "@/queries/traces-v2";
import { SectionHeading } from "../shared";
import { SubSectionHeading } from "./shared";
import { timelineId } from "./timelineId";

export function FetchSpan({ span }: { span: MizuFetchSpan }) {
  const id = timelineId(span);

  return (
    <div id={id}>
      <div className="flex flex-col gap-2">
        <SectionHeading>Fetch</SectionHeading>

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
