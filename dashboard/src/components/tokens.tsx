import { EllipsisVertical } from "lucide-react";
import { Line, LineChart } from "recharts";
import { Button } from "./ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const chartData = [
  { month: "January", requests: 186 },
  { month: "February", requests: 305 },
  { month: "March", requests: 237 },
  { month: "April", requests: 73 },
  { month: "May", requests: 209 },
  { month: "June", requests: 214 },
];

const chartConfig = {
  requests: {
    label: "Requests",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function Tokens() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Email</TableHead>
          <TableHead className="text-right">Latest activity</TableHead>
          <TableHead className="w-[80px] text-right">Activity</TableHead>
          <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {new Array(20).fill(false).map((_, index) => {
          return (
            <TableRow key={index}>
              <TableCell>
                <span>j.doe@example.com</span>
              </TableCell>
              <TableCell className="text-right">2 hours ago</TableCell>
              <TableCell className="text-right">
                <div className="ml-auto max-w-16">
                  <ChartContainer config={chartConfig}>
                    <LineChart
                      accessibilityLayer
                      data={chartData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Line
                        dataKey="requests"
                        type="natural"
                        stroke="var(--color-requests)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button>
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Token</DropdownMenuLabel>
                    <DropdownMenuSub />
                    <DropdownMenuItem>Revoke</DropdownMenuItem>
                    <DropdownMenuItem>Regenerate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
