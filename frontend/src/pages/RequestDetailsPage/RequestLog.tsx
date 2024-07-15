import { MizuRequestStart } from "@/queries";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";
import { fpxLogId } from "./minimapIdUtils"; // Import the utility function
import { RequestMethod } from "./shared";
import { RequestPath, SectionHeading } from "./shared";

export function RequestLog({
  message,
  logId,
}: { message: MizuRequestStart; logId: string }) {
  const { method, path, headers, query, params, body } = message;
  const id = fpxLogId({ message, id: logId, level: "" }); // Use the utility function to generate the ID

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex gap-4 items-center">
        <SectionHeading>Incoming Request</SectionHeading>
        <div className="flex gap-2 items-center pt-1">
          <RequestMethod method={method} />
          <RequestPath>{path}</RequestPath>
        </div>
      </div>
      <KeyValueTable keyValue={headers} caption="Headers" />
      {query && <KeyValueTable keyValue={query} caption="Query" />}
      {params && <KeyValueTable keyValue={params} caption="Parameters" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
