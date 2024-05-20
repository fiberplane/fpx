import { format } from 'date-fns'

import {
  FileIcon as File,
  ListBulletIcon as ListFilter, // FIXME
  StretchHorizontallyIcon as MoreHorizontal,
  ExclamationTriangleIcon,
  CaretSortIcon,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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

import { useEffect, useState } from "react"
import { Layout } from "./Layout"
import { MizuLog, transformToLog } from "./queries/decoders"

function useMizulogs() {
  const [logs, setLogs] = useState([] as Array<MizuLog>)
  useEffect(() => {
    fetch("http://localhost:8788/v0/logs", { mode: "cors" }).then(r => r.json())
      .then(j => {
        setLogs(j.logs.map(transformToLog))
      }).catch((e: unknown) => {
        console.error("Error fetching logs: ", e);
        if (e instanceof Error) {
          alert(`Error fetching logs: ${e.message}`);
        }
      })
  }, [])

  return logs;
}

const MessageJson = ({ message }: { message: MizuLog["message"] }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          JSON Message
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
        @radix-ui/primitives
      </div> */}
      <CollapsibleContent className="space-y-2">
        {message && typeof message === "object" && Object.entries(message).map(([key, value]) => {
          return (
            <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
              {key}: {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
            </div>
          )
        })}
        {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          {JSON.stringify(message, null, 2)}
        </div> */}
        {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @stitches/react
        </div> */}
      </CollapsibleContent>
    </Collapsible>
  )
}

const LogRow = ({ log } : { log: MizuLog}) => {
  const l = log;
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="space-y-2"
      >
        <TableRow>
          <TableCell className="hidden sm:table-cell">
            <ExclamationTriangleIcon
              className="h-3.5 w-3.5"
            />
          </TableCell>
          <TableCell className="font-medium">
            {l.message === "string" ? l.message : <MessageJson message={l.message} />}
          </TableCell>
          <TableCell>
            <Badge variant="outline">Draft</Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {format(new Date(l.createdAt), 'MMMM d, HH:mm')}
          </TableCell>
          <TableCell>
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
          </TableCell>
        </TableRow>
        <CollapsibleContent className="space-y-2">
          <TableRow>

          </TableRow>
        </CollapsibleContent>
      </Collapsible>

  
    </>
  )
}

export function App() {
  const logs = useMizulogs();
  return (
    <Layout>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="error">Error</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
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
                <DropdownMenuCheckboxItem>Draft</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Archived
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[32px] sm:table-cell">
                      <span className="sr-only">Icon</span>
                    </TableHead>
                    <TableHead>Log</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Timestamp
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => {
                    return <TableRow>
                      <TableCell className="hidden sm:table-cell">
                        <ExclamationTriangleIcon
                          className="h-3.5 w-3.5"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {typeof l.message === "string" ? l.message : <MessageJson message={l.message} />}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Draft</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(l.createdAt), 'MMMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  })}
                  {/* {logs.map(l => <LogRow log={l} key={l.id} />)} */}
                </TableBody>
              </Table>
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
    </Layout>
  )
}

export default App;