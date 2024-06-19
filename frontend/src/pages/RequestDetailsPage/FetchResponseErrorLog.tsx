import { Status } from "@/components/ui/status";
import { MizuFetchError } from "@/queries/types";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";

export function FetchResponseErrorLog({
  message,
}: { message: MizuFetchError }) {
  const { status, headers, body, url } = message;
  const id = `fetch-response-error-${status}-${url}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold">
          <span className="font-mono bg-muted/50 p-1 rounded-lg lowercase text-orange-500">
            Fetch
          </span>{" "}
          Error
        </h3>
        <Status statusCode={Number(status)} />
        <p className="text-sm">{url}</p>
      </div>
      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
