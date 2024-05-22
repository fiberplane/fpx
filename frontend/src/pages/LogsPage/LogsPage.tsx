import { useMemo } from "react"
import {
  FileIcon as File,
  ListBulletIcon as ListFilter, // FIXME
  StretchHorizontallyIcon as MoreHorizontal,
  ExclamationTriangleIcon,
  InfoCircledIcon
} from "@radix-ui/react-icons"

import { Badge } from "@/components/ui/badge"
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
  DropdownMenuItem,
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

import { MockLog, useMockLogs } from '@/queries/mock-data'
import { formatDate } from "@/utils/utils"

import { LogSheet, } from "./LogSheet"
import { MessageJson } from "./MessageJson"
import { useMizulogs } from "@/queries/logs"
import { MizuTrace } from "@/queries/decoders"


type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const LogsTable = ({ logs, filter, traces }: { logs: MockLog[], filter: LevelFilter, traces: Array<MizuTrace> }) => {
  const filteredLogs = useMemo(() => {
    if (filter === "all") {
      return logs
    }
    return logs.filter(l => l.level === filter)
  }, [logs, filter])
  return (<Table>
    <TableHeader>
      <TableRow>
        <TableHead className="hidden w-[32px] sm:table-cell">
          <span className="sr-only">Icon</span>
        </TableHead>
        <TableHead>Level</TableHead>
        <TableHead>Log</TableHead>
        <TableHead className="hidden md:table-cell">
          Timestamp
        </TableHead>
        <TableHead>
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredLogs.map(l => {
        return <TableRow key={l.id}>
          <TableCell className="hidden sm:table-cell">
            {l.level === "error" && <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
            {l.level === "info" && <InfoCircledIcon className="h-3.5 w-3.5" />}
          </TableCell>
          <TableCell>
            <Badge variant="outline">{l.level}</Badge>
          </TableCell>
          <TableCell className="font-medium">
            {typeof l.message === "string" ? l.message : <MessageJson message={l.message} />}
          </TableCell>

          <TableCell className="hidden md:table-cell">
            {formatDate(new Date(l.timestamp))}
          </TableCell>
          <TableCell className="flex items-center space-x-2">
            <DropdownMenu>
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
            </DropdownMenu>
            <LogSheet log={l} trace={traces.find(ts => ts.some(t => t.traceId === l.traceId))} />
          </TableCell>
        </TableRow>
      })}
      {/* {logs.map(l => <LogRow log={l} key={l.id} />)} */}
    </TableBody>
  </Table>)
}

export function LogsPage() {
  const { logs, traces } = useMizulogs();
  console.log("TRACES", traces)
  // const logs = useMockLogs();
  return (
    <Tabs defaultValue="error">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error</TabsTrigger>
          <TabsTrigger value="ignored" className="hidden sm:flex">
            Ignored
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
            <CardTitle>Logs</CardTitle>
            <CardDescription>
              View logs from your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogsTable logs={logs} traces={traces} filter="all" />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{logs.length}</strong> of <strong>{logs.length}</strong>{" "}
              logs
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="error">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>
              View error logs from your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogsTable logs={logs} traces={traces} filter="error" />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{logs.length}</strong> of <strong>{logs.length}</strong>{" "}
              logs
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}