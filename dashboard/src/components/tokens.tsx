import { EllipsisVertical, HeartPulse, PauseIcon } from "lucide-react";
import { Line, LineChart } from "recharts";
import { TimeAgo } from "./time-ago";
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
import { add, differenceInMinutes } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

const chartData = [
  { month: "January", successful: 186, failed: 20 },
  { month: "February", successful: 305, failed: 20 },
  { month: "March", successful: 237, failed: 28 },
  { month: "April", successful: 73, failed: 50 },
  { month: "May", successful: 209, failed: 50 },
  { month: "June", successful: 214, failed: 128 },
];

const chartConfig = {
  successful: {
    label: "Successful",
    color: "hsl(var(--chart-2))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-5))",
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
          const date = add(new Date(), { minutes: -10 });

          return (
            <TableRow key={index}>
              <TableCell>
                <span>j.doe@example.com</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex gap-4 justify-items-end items-center">
                  <ActivityIcon date={date} />
                  <TimeAgo date={date.toISOString()} />
                </span>
              </TableCell>
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

function ActivityIcon({ date }: { date: Date }) {
  const diff = differenceInMinutes(new Date(), date);

  const containerClassName = "bg-muted -m-2 p-1";
  const iconClassName = "w-4 h-4";

  return (
    <TooltipProvider>
      <Tooltip>
        {diff > 30 ? (
          <>
            <TooltipTrigger asChild>
              <div className={containerClassName}>
                <PauseIcon className={iconClassName} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stale</p>
            </TooltipContent>
          </>
        ) : (
          <>
            <TooltipTrigger asChild>
              <div className={containerClassName}>
                <HeartPulse className={iconClassName} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Active</p>
            </TooltipContent>
          </>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
