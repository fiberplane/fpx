import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { MizuLog, isMizuFetchStartMessage } from "@/queries";
import { KeyValueTable } from "./KeyValueTable";
import { TextOrJsonViewer } from "./TextJsonViewer";

export function FetchRequestLog({ log }: { log: MizuLog }) {
  const { message } = log;
  const url = isMizuFetchStartMessage(message) ? message?.url : "UNKNOWN_URL";

  const { headers, body, method } = message;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <h3 className="text-xl font-semibold">
          <span className="font-mono lowercase">Fetch</span> Request
        </h3>
        <span className="text-primary text-xs">{method}</span>
        <p className="text-xs">{url}</p>
      </div>

      {headers && <KeyValueTable keyValue={headers} caption="Headers" />}

      <Card className="bg-muted/20 rounded-xl">
        <CardTitle className="text-sm p-2 font-normal bg-muted/50 rounded-t-xl">
          Body
        </CardTitle>
        <CardContent className="p-2">
          <TextOrJsonViewer text={body} />
        </CardContent>
      </Card>

      {/* <pre> { */}
      {/*   JSON.stringify(log, null, 2) */}
      {/* }</pre> */}
    </section>
  );
}
