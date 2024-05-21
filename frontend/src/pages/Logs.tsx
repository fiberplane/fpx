import { useMemo, useState } from "react"
import {
  FileIcon as File,
  ListBulletIcon as ListFilter, // FIXME
  StretchHorizontallyIcon as MoreHorizontal,
  ExclamationTriangleIcon,
  CaretSortIcon
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

import { Layout } from "./Layout"
import { MockLog, useMockLogs } from '@/queries/mock-data'
import { formatDate } from "@/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export const MessageJson = ({ message }: { message: MockLog["message"] }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="flex items-center justify-between space-x-4">
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

// const LogRow = ({ log } : { log: MizuLog}) => {
//   const l = log;
//   const [isOpen, setIsOpen] = useState(false)

//   return (
//     <>
//       <Collapsible
//         open={isOpen}
//         onOpenChange={setIsOpen}
//         className="space-y-2"
//       >
//         <TableRow>
//           <TableCell className="hidden sm:table-cell">
//             <ExclamationTriangleIcon
//               className="h-3.5 w-3.5"
//             />
//           </TableCell>
//           <TableCell className="font-medium">
//             {l.message === "string" ? l.message : <MessageJson message={l.message} />}
//           </TableCell>
//           <TableCell>
//             <Badge variant="outline">Draft</Badge>
//           </TableCell>
//           <TableCell className="hidden md:table-cell">
//             {formatDate(new Date(l.createdAt))}
//           </TableCell>
//           <TableCell>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button
//                   aria-haspopup="true"
//                   size="icon"
//                   variant="ghost"
//                 >
//                   <MoreHorizontal className="h-4 w-4" />
//                   <span className="sr-only">Toggle menu</span>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                 <DropdownMenuItem>Edit</DropdownMenuItem>
//                 <DropdownMenuItem>Delete</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </TableCell>
//         </TableRow>
//         <CollapsibleContent className="space-y-2">
//           <TableRow>

//           </TableRow>
//         </CollapsibleContent>
//       </Collapsible>


//     </>
//   )
// }

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const LogsTable = ({ logs, filter }: { logs: MockLog[], filter: LevelFilter }) => {
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
        return <TableRow>
          <TableCell className="hidden sm:table-cell">
            <ExclamationTriangleIcon
              className="h-3.5 w-3.5"
            />
          </TableCell>
          <TableCell>
            <Badge variant="outline">{l.level}</Badge>
          </TableCell>
          <TableCell className="font-medium">
            {typeof l.message === "string" ? l.message : <MessageJson message={l.message} />}
          </TableCell>

          <TableCell className="hidden md:table-cell">
            {formatDate(new Date(l.createdAt))}
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
  </Table>)
}

export function LogsPage() {
  // const logs = useMizulogs();
  const logs = useMockLogs();
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
            <LogsTable logs={logs} filter="all" />
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
            <LogsTable logs={logs} filter="error" />
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