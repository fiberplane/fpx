import { MizuFetchStart } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";
import { RequestMethod } from "./Method";

export function FetchRequestLog({ message }: { message: MizuFetchStart }) {
  const { headers, body, method, url } = message;
  const id = `fetch-request-${method}-${url}`;
  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex flex-col md:flex-row gap-4 max-md:justify-content md:items-center">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Request
        </h3>
        <div className="flex flex-grow gap-2 items-center">
          <RequestMethod method={method} />
          <p className="text-sm flex-grow overflow-ellipsis">{url}</p>
        </div>
      </div>

      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
