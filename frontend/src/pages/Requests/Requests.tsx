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
import { Button } from "@/components/ui/button"
import { DataTable } from "./DataTable";
import { columns } from "./columns";
import { fetchMizuTraces } from "@/queries/react-query-test"
import { useQuery } from "react-query"

export function RequestsPage() {
  const query = useQuery({ queryKey: ['mizuTraces'], queryFn: fetchMizuTraces })

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error Responses</TabsTrigger>
          <TabsTrigger value="ignored" className="hidden sm:flex">
            With Any Errors
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {/* <DropdownMenu>
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
          </Button> */}
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => {
            fetch("http://localhost:8788/v0/logs/ignore", {
              method: "POST",
              body: JSON.stringify({
                logIds: query.data?.flatMap(t => t.logs?.map(l => l.id))
              })
            }).then(() => {
              query.refetch();
              alert("Successfully ignored all");
            })
          }}>
            <MoonIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Ignore All
            </span>
          </Button>
          <Button variant="destructive" size="sm" className="h-8 gap-1" onClick={() => {
            fetch("http://localhost:8788/v0/logs/delete-all-hack", {
              method: "POST",
            }).then(() => {
              query.refetch();
              alert("Successfully deleted all");
            })
          }}>
            <TrashIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Delete All
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
            <DataTable columns={columns} data={query.data ?? []} filter="all" />
            {/* <RequestsTable traces={traces} filter="all" /> */}
          </CardContent>
          <CardFooter>
            {query?.data?.length ? (
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{query?.data?.length}</strong> of <strong>{query?.data?.length}</strong>{" "}
                requests
              </div>
            ) : null}

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
            <DataTable columns={columns} data={query.data ?? []} filter="error" />
          </CardContent>
          <CardFooter>
            {query?.data?.length ? (
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{query?.data?.length}</strong> of <strong>{query?.data?.length}</strong>{" "}
                requests
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}