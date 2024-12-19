import { Chart } from "@/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";
import { useFetchInsightsOverview } from "@/queries/insights";

export function Dashboard() {
  const { data } = useFetchInsightsOverview();

  if (!data) {
    return <>Loading</>;
  }

  console.log(data);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/insights" className="text-xl text-green-500">
            {data.totalRequest}
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/insights" className="text-xl text-red-500">
            {data.failedRequest}
          </Link>
        </CardContent>
      </Card>
      <div className="col-span-2">
        <Chart requests={data.requests} />
      </div>
    </div>
  );
}
