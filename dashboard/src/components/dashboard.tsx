import { Chart } from "@/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";

export function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/insights" className="text-xl text-green-500">
            0
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/insights" className="text-xl text-red-500">
            0
          </Link>
        </CardContent>
      </Card>
      <div className="col-span-2">
        <Chart />
      </div>
    </div>
  );
}
