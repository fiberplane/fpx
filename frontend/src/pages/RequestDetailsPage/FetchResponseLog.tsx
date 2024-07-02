import { Status } from "@/components/ui/status";
import { MizuFetchEnd } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";
import { RequestPath, SectionHeading } from "./shared";

export function FetchResponseLog({
  message,
  logId,
}: { message: MizuFetchEnd; logId: string }) {
  const { status, headers, body, url } = message;
  const id = `fetch-response-${status}-${url}-${logId}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <SectionHeading>
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Response
        </SectionHeading>
        <Status statusCode={Number(status)} />
        <RequestPath>{url}</RequestPath>
      </div>
      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
