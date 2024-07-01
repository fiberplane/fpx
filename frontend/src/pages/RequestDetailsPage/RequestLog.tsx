import { MizuRequestStart } from "@/queries";
import { BodyViewer } from "./BodyViewer";
import { KeyValueTable } from "./KeyValueTable";

export function RequestLog({ message }: { message: MizuRequestStart }) {
  const { method, path, headers, query, params, body } = message;
  const id = `request-${method}-${path}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex gap-4 items-center">
        <h3 className="text-xl font-semibold">Incoming Request</h3>
        <div className="flex gap-2 items-center pt-1">
          <span className="text-primary text-sm">{method}</span>
          <p className="text-sm font-mono">{path}</p>
        </div>
      </div>
      <KeyValueTable keyValue={headers} caption="Headers" />
      {query && <KeyValueTable keyValue={query} caption="Query" />}
      {params && <KeyValueTable keyValue={params} caption="Parameters" />}
      {body && <BodyViewer body={body} />}
    </section>
  );
}
