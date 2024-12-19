import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DataPoint } from "@/queries/insights";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const requestsChartConfig = {
  totalRequests: {
    label: "Total requests",
    color: "hsl(var(--chart-5))",
  },
  failedRequests: {
    label: "Failed requests",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function Chart({ requests }: { requests: Array<DataPoint> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={requestsChartConfig}>
          <LineChart
            accessibilityLayer
            data={requests}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value instanceof Date) {
                  return format(value, "HH:mm");
                }

                return "";
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="totalRequests"
              type="natural"
              stroke="var(--color-totalRequests)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="failedRequests"
              type="natural"
              stroke="var(--color-failedRequests)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
