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
import { DataTable } from "@/components/ui/DataTable";
import { columns } from "./columns";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { MizuTrace } from "@/queries/decoders";
import { useMizuTraces } from "@/queries/queries";
import { useQueryClient } from "react-query";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const RequestsTable = ({ traces, filter }: { traces: MizuTrace[]; filter: LevelFilter }) => {
	const navigate = useNavigate();

	const filteredTraces = useMemo(() => {
		if (filter === "all") {
			return traces
		}
		return traces.filter(trace => trace.logs.some(log => log.level === filter));
	}, [traces, filter])

	return (
		<DataTable columns={columns} data={filteredTraces ?? []} handleRowClick={row => navigate(`/requests/${row.id}`)} />
	)
}

export function RequestsPage() {
	const queryClient = useQueryClient();
	const query = useMizuTraces();

	useEffect(() => {

		const socket = new WebSocket("ws://localhost:8789")

		socket.onopen = () => {
			console.log("Connected to update server")
		}

		socket.onmessage = (ev) => {
			console.log("Received message", ev.data)
			const data: string[] = JSON.parse(ev.data);
			queryClient.invalidateQueries(...data)
		};

		socket.onclose = (ev) => { console.log("Disconnected from update server", ev) }

		return () => { socket.close() }

	}, [queryClient]);

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
						<RequestsTable traces={query.data ?? []} filter="all" />
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
						<RequestsTable traces={query.data ?? []} filter="error" />
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
