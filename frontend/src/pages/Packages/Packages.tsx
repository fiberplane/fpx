import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ISSUE_TABLE_ID } from "@/lib/constants";
import { GitHubIssue } from "@/lib/types";
import { loadIssues } from "@/queries/issues";
import { humanReadableDate } from "@/utils/utils";
// import { formatDate } from "@/utils/utils";
import {
  MagnifyingGlassIcon as Search,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  CircleIcon,
} from "@radix-ui/react-icons";
import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { type Store, createStore } from "tinybase/store";
import {
  Provider,
  useCreateStore,
  useSliceRowIds,
  useTable,
} from "tinybase/ui-react";

const IssuesTable = ({ store }: { store: Store }) => {
  // const filteredTraces = useMemo(() => {
  //   if (filter === "all") {
  //     return traces;
  //   }
  //   return traces.filter((trace) =>
  //     trace.logs.some((log) => log.level === filter),
  //   );
  // }, [traces, filter]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useMemo(async () => {
    if (!store.hasTable("issues")) {
      await loadIssues(store, "honojs", "hono");
    }
  }, []);

  const issues = useTable(ISSUE_TABLE_ID, store);

  console.log(issues);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  // const issues = useMemo(() => {
  //   const issues = store.getTable(ISSUE_TABLE_ID);
  //   console.log(issues);
  //   return issues;
  // }, []);

  return (
    <Provider store={store}>
      {/* {JSON.stringify(issues)} */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Opened/Closed</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead>Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(issues).map((issue: GitHubIssue) => {
            return (
              <TableRow key={issue.id}>
                <TableCell>
                  {issue.pull_request ? (
                    "PR"
                  ) : (
                    <CircleIcon
                      className={`${
                        issue.state === "open"
                          ? "text-green-800"
                          : "text-purple-800"
                      }`}
                    />
                  )}
                </TableCell>
                <TableCell className="truncate">{issue.title}</TableCell>
                <TableCell>
                  {issue.closed_at
                    ? `closed ${humanReadableDate(issue.closed_at)}`
                    : `opened ${humanReadableDate(issue.created_at)}`}
                </TableCell>
                <TableCell>{`last update ${humanReadableDate(
                  issue.updated_at,
                )}`}</TableCell>
                <TableCell className="max-w-[500px] h-10 truncate">
                  <ReactMarkdown
                    unwrapDisallowed
                    allowedElements={["code", "strong", "emphasis"]}
                  >
                    {issue.body}
                  </ReactMarkdown>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Provider>
  );
};
export const PackagesPage = () => {
  // const { traces } = useMizulogs();
  const deps = [
    {
      title: "hono",
      description: "Our favorite framework",
    },
    {
      title: "drizzle-orm",
      description: "Our favorite ORM",
    },
    {
      title: "@neondatabase/serverless",
      description: "Our favorite database",
    },
  ];

  const issuesStore = useCreateStore(createStore);

  return (
    <>
      <div className="space-y-2">
        <h2 className="font-semibold tracking-tight leading-none">
          Dependencies
        </h2>
        <p className="text-gray-500">
          Search for issues in repos for your dependencies
        </p>
      </div>

      <section className="grid grid-cols-4">
        <div className="col-span-1 p-4 space-y-2">
          {deps.map((dep) => {
            return (
              <Card key={dep.title}>
                <CardHeader>
                  <CardTitle>{dep.title}</CardTitle>
                  <CardDescription>{dep.description}</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            );
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
              <IssuesTable store={issuesStore} />
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};
