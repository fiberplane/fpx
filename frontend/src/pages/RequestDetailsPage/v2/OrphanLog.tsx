import { MizuOrphanLog } from "@/queries";
import { SectionHeading } from "../shared";
import { timelineId } from "./timelineId";
// import { SubSectionHeading } from "./shared";

export function OrphanLog({ log }: { log: MizuOrphanLog }) {
  const id = timelineId(log);
  return (
    <div id={id}>
      <div className="flex flex-col gap-2">
        <SectionHeading>Orphan Log</SectionHeading>
      </div>
    </div>
  );
}
