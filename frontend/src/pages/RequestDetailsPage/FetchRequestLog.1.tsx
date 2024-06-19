import { MizuFetchStart } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";

export function FetchRequestLog({ message }: { message: MizuFetchStart }) {
  const { headers, body, method, url } = message;
  const id = `fetch-request-${method}-${url}`;
  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex gap-2 items-center">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Request
        </h3>
        <span className="text-primary text-sm">{method}</span>
        <p className="text-sm">{url}</p>
      </div>

      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
