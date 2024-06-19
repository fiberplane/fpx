import { Status } from "@/components/ui/status";
import { MizuFetchEnd } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";

export function FetchResponseLog({ message }: { message: MizuFetchEnd }) {
  const { status, headers, body, url } = message;
  const id = `fetch-response-${status}-${url}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Response
        </h3>
        <Status statusCode={Number(status)} />
        <p className="text-sm">{url}</p>
      </div>
      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
