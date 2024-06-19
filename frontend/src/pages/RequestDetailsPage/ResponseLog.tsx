import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Status } from "@/components/ui/status";
import { MizuRequestEnd } from "@/queries";
import { KeyValueTable } from "./KeyValueTable";
import { TextOrJsonViewer } from "./TextJsonViewer";

export function ResponseLog({ message }: { message: MizuRequestEnd }) {
  const { status, headers, body } = message;
  const id = `response-${status}-${message.path}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold">Outgoing Response</h3>
        <Status statusCode={Number(status)} />
      </div>
      <KeyValueTable keyValue={headers} caption="Headers" />
      <Card className="bg-muted/20 rounded-xl">
        <CardTitle className="text-sm p-2 font-normal bg-muted/50 rounded-t-xl">
          Body
        </CardTitle>
        <CardContent className="p-2">
          <TextOrJsonViewer text={body} />
        </CardContent>
      </Card>
    </section>
  );
}
