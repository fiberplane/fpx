import { useEffect, useMemo } from "react"
import {
  FileIcon as File,
  ListBulletIcon as ListFilter, // FIXME
  ExclamationTriangleIcon,
  InfoCircledIcon
} from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { formatDate } from "@/utils/utils"
import { useMizulogs } from "@/queries/logs"
import type { MizuTrace } from "@/queries/decoders"
import { RequestSheet, } from "./RequestSheet"


type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const RequestsTable = ({ filter, traces }: { filter: LevelFilter, traces: Array<MizuTrace> }) => {
  const filteredTraces = useMemo(() => {
    if (filter === "all") {
      return traces
    }
    return traces.filter(trace => trace.logs.some(log => log.level === filter));
  }, [traces, filter])
  return (<Table>
    <TableHeader>
      <TableRow>
        <TableHead className="hidden w-[32px] sm:table-cell">
          <span className="sr-only">Icon</span>
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Summary</TableHead>
        <TableHead className="hidden md:table-cell">
          Timestamp
        </TableHead>
        <TableHead>
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredTraces.map(t => {
        return <TableRow key={t.logs[0].id}>
          <TableCell className="hidden sm:table-cell">
            {t.logs.some(t => t.level === "error") ? <ExclamationTriangleIcon className="h-3.5 w-3.5" /> : <InfoCircledIcon className="h-3.5 w-3.5" />}
          </TableCell>
          <TableCell>
            {t.status}
          </TableCell>
          <TableCell className="font-medium">
            {t.description}
          </TableCell>

          <TableCell className="hidden md:table-cell font-mono text-xs" >
            {formatDate(new Date(t.logs[0].timestamp))} to {formatDate(new Date(t.logs[t.logs.length - 1].timestamp))}
          </TableCell>
          <TableCell className="flex items-center space-x-2">
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-haspopup="true"
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
            <RequestSheet trace={t} />
          </TableCell>
        </TableRow>
      })}
      {/* {logs.map(l => <LogRow log={l} key={l.id} />)} */}
    </TableBody>
  </Table>)
}

export function RequestsPage() {
  const { traces } = useMizulogs();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    console.log("TRACES", traces)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traces.length])
  return (
    <Tabs defaultValue="error">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error Responses</TabsTrigger>
          <TabsTrigger value="ignored" className="hidden sm:flex">
            With Any Errors
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Error
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Ignored
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              Inspect requests to your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestsTable traces={traces} filter="all" />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{traces.length}</strong> of <strong>{traces.length}</strong>{" "}
              requests
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="error">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>4xx and 5xx Errors</CardTitle>
            <CardDescription>
              View requests that resulted in 4xx or 5xx errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestsTable traces={traces} filter="error" />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{traces.length}</strong> of <strong>{traces.length}</strong>{" "}
              requests
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}