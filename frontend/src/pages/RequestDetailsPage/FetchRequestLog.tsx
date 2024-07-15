import { MizuFetchStart } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";
import { minimapId } from "./minimapId";
import { RequestMethod } from "./shared";
import { RequestPath, SectionHeading } from "./shared";

export function FetchRequestLog({
  message,
  logId,
}: { message: MizuFetchStart; logId: string }) {
  const { headers, body, method, url } = message;
  const id = minimapId({ message, id: logId, level: "" });
  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex flex-col md:flex-row gap-4 max-md:justify-content md:items-center">
        <SectionHeading>
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Request
        </SectionHeading>
        <div className="flex flex-grow gap-2 items-center">
          <RequestMethod method={method} />
          <RequestPath className="flex-grow overflow-ellipsis">
            {url}
          </RequestPath>
        </div>
      </div>

      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
