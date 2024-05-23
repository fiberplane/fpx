import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MizuTrace } from "@/queries/decoders";
import { useMizulogs } from "@/queries/logs";
import { formatDate } from "@/utils/utils";
import {
	MagnifyingGlassIcon as Search,
	ExclamationTriangleIcon,
	InfoCircledIcon
} from "@radix-ui/react-icons";
import { useMemo } from "react";

type LevelFilter = "all" | "error" | "warning" | "info" | "debug";

const IssuesTable = ({ filter, traces }: { filter: LevelFilter, traces: Array<MizuTrace> }) => {
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
					</TableCell>
				</TableRow>
			})}
			{/* {logs.map(l => <LogRow log={l} key={l.id} />)} */}
		</TableBody>
	</Table>)
}
export const PackagesPage = () => {
	const { traces } = useMizulogs();
	const deps = [{
		title: "hono",
		description: "Our favorite framework"
	},
	{
		title: "drizzle-orm",
		description: "Our favorite ORM"
	},
	{
		title: "@neondatabase/serverless",
		description: "Our favorite database"
	}
	]
	return (<>
		<div className="space-y-2">
			<h2 className="font-semibold tracking-tight leading-none">Dependencies</h2>
			<p className="text-gray-500">Search for issues in repos for your dependencies</p>
		</div>

		<section className="grid grid-cols-4">
			<div className="col-span-1 p-4 space-y-2">

				{deps.map((dep) => {
					return (<Card>
						<CardHeader>
							<CardTitle>{dep.title}</CardTitle>
							<CardDescription>{dep.description}</CardDescription>
						</CardHeader>
						<CardContent>
						</CardContent>
					</Card>)
				})}

			</div>
			<div className="col-span-3 p-4 h-full">
				<div className="relative ml-auto flex-1 md:grow-0 mb-2 items-center">
					<Input
						type="search"
						placeholder="Search for your error..."
						className="w-full rounded-lg bg-background pl-8 h-12"
					/>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Results in your dependencies</CardTitle>
					</CardHeader>
					<CardContent>
						<IssuesTable traces={traces} filter="all" />
					</CardContent>
				</Card>
			</div>
		</section>

	</>)
}


