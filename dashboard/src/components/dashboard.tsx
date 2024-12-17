import { Chart } from "@/chart";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Total</CardTitle>
        </CardHeader>
        <CardContent>0</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Failed</CardTitle>
        </CardHeader>
        <CardContent>0</CardContent>
      </Card>
      <div className="col-span-2">
        <Chart />
      </div>
    </div>
  );
}
