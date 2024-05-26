import {
  // FileIcon,
  TrashIcon,
  MoonIcon,
  // ListBulletIcon as ListFilter, // FIXME
} from "@radix-ui/react-icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
import { useMizuTraces } from "@/queries/queries"
import { isError } from "react-query"
import { useParams } from "react-router-dom";

import { TraceDetails } from "./RequestDetails";

function useRequestDetails(traceId?: string) {
  const query = useMizuTraces();
  const trace = traceId ? query.data?.find(t => t.id === traceId) : undefined;
  return {
    isLoading: query.isLoading,
    isError: isError(query),
    trace
  };
}

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const { trace } = useRequestDetails(traceId);

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Errors</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {/* TODO - Add global table action buttons? */}
        </div>
      </div>
      <TabsContent value="all">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Request Logs and Events</CardTitle>
            <CardDescription>
              Inspect all logs and events in this request
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trace ? <TraceDetails trace={trace} /> : (
              <div className="flex items-center justify-center h-32">
                <MoonIcon className="w-8 h-8 text-gray-400" />
                <span className="ml-2 text-gray-400">No logs found</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {trace?.logs?.length ? (
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{trace?.logs?.length}</strong> of <strong>{trace?.logs?.length}</strong>{" "}
                events
              </div>
            ) : null}

          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="error">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Errors</CardTitle>
            <CardDescription>
              View requests that had any error logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <DataTable columns={columns} data={query.data ?? []} filter="error" /> */}
          </CardContent>
          <CardFooter>
            {trace?.logs?.length ? (
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{trace?.logs?.length}</strong> of <strong>{trace?.logs?.length}</strong>{" "}
                events
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}