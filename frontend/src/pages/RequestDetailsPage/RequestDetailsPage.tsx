import {
  // FileIcon,
  TrashIcon,
  GitHubLogoIcon,
  MoonIcon,
  // ListBulletIcon as ListFilter, // FIXME
} from "@radix-ui/react-icons";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button"
import { useMatchingIssues, useMizuTraces } from "@/queries/queries";
import { isError } from "react-query";
import { useParams } from "react-router-dom";

import { TraceDetails } from "./RequestDetails";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

function useRequestDetails(traceId?: string) {
  const query = useMizuTraces();
  const trace = traceId ? query.data?.find((t) => t.id === traceId) : undefined;
  return {
    isLoading: query.isLoading,
    isError: isError(query),
    trace,
  };
}

function useIssues(traceId: string) {
  const query = useMatchingIssues({ id: traceId });
  const issues = query?.data;
  return {
    isLoading: query.isLoading,
    isError: isError(query),
    issues,
  };
}

type SmallIssue = { id: number; title: string; body: string; url: string };

const columns: ColumnDef<SmallIssue>[] = [
  {
    id: "title",
    accessorFn: (row) => row.title,
    header: "Title",
    cell: (props) => {
      return <ReactMarkdown>{props.getValue()}</ReactMarkdown>;
    },
  },
  {
    id: "body",
    accessorFn: (row) => row.body,
    header: "Preview",
    meta: {
      cellClassName: "truncate overflow-hidden max-w-[500px]",
    },
    cell: (props) => {
      return (
        <ReactMarkdown
          unwrapDisallowed
          allowedElements={["code", "strong", "emphasis"]}
        >
          {props.getValue()}
        </ReactMarkdown>
      );
    },
  },
];

function IssuesTable({ issues }: { issues: SmallIssue[] }) {
  const handleRowClick = (row: Row<SmallIssue>) => {
    window.location.href = row.original.html_url;
  };
  return (
    <Card className="max-w-5xl mt-11" x-chunk="dashboard-06-chunk-0">
      <CardHeader>
        <CardTitle>Relevant Issues</CardTitle>
        <CardDescription>
          These GitHub issues are likely related to this error
        </CardDescription>
      </CardHeader>
      <CardContent>
        {issues.map((issue) => {
          return (
            <Card key={issue.id} className="mt-2 max-h-24">
              <CardHeader>
                <CardTitle>
                  <ReactMarkdown>{issue.title}</ReactMarkdown>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown
                  unwrapDisallowed
                  allowedElements={["code", "strong", "emphasis"]}
                  className="text-sm wrap truncate"
                >
                  {issue.body}
                </ReactMarkdown>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const { trace } = useRequestDetails(traceId);
  const { issues } = useIssues(traceId);

  const [showIssues, setShowIssues] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          size="icon"
          variant="default"
          className="w-auto p-2"
          onClick={() => setShowIssues(!showIssues)}
        >
          <GitHubLogoIcon className="mr-2 h-4 w-4" /> Relevant Issues
        </Button>
      </div>
      <div className="flex gap-4">
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel className="flex-1">
            <Tabs defaultValue="all" className="w-full flex-1">
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
                    {trace ? (
                      <TraceDetails trace={trace} />
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <MoonIcon className="w-8 h-8 text-gray-400" />
                        <span className="ml-2 text-gray-400">
                          No logs found
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {trace?.logs?.length ? (
                      <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{trace?.logs?.length}</strong> of{" "}
                        <strong>{trace?.logs?.length}</strong> events
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
                        Showing <strong>1-{trace?.logs?.length}</strong> of{" "}
                        <strong>{trace?.logs?.length}</strong> events
                      </div>
                    ) : null}
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          {showIssues && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel>
                <IssuesTable issues={issues} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </>
  );
}
