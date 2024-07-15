import { Status } from "@/components/ui/status";
import { MizuFetchError } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";
import { minimapId } from "./minimapId"; 
import { SectionHeading } from "./shared";

export function FetchResponseErrorLog({
  message,
  logId,
}: { message: MizuFetchError; logId: string }) {
  const id = minimapId({ message, id: logId, level: "" }); 
  const { status, headers, body, url } = message;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <SectionHeading>
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Error
        </SectionHeading>
        <Status statusCode={Number(status)} />
        <p className="text-sm">{url}</p>
      </div>
      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
