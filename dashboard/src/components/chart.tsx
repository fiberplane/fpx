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
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const chartData = [
  { month: "January", successful: 186, failed: 44 },
  { month: "February", successful: 305, failed: 230 },
  { month: "March", successful: 237, failed: 120 },
  { month: "April", successful: 73, failed: 10 },
  { month: "May", successful: 209, failed: 414 },
  { month: "June", successful: 214, failed: 8 },
];

const chartConfig = {
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-5))",
  },
  successful: {
    label: "Successful",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function Chart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="successful"
              type="natural"
              stroke="var(--color-successful)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="failed"
              type="natural"
              stroke="var(--color-failed)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
