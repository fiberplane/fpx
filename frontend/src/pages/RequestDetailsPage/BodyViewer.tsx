import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { TextOrJsonViewer } from "./TextJsonViewer";

export function BodyViewer({ body }: { body: string }) {
  return (
    <Card className="bg-muted/20 rounded-xl">
      <CardTitle className="text-sm p-2 font-normal bg-muted/50 rounded-t-xl">
        Body
      </CardTitle>
      <CardContent className="p-2">
        <TextOrJsonViewer text={body} />
      </CardContent>
    </Card>
  );
}
