import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { GitHubIssue } from "@/lib/types";
import { useDependencies, useGitHubIssues } from "@/queries/queries";
import { useMemo } from "react";
import { DataTable } from "../RequestDetailsPage/DataTable";
import { columns } from "./columns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { humanReadableDate } from "@/utils/utils";
import { CircleIcon } from "@radix-ui/react-icons";
import ReactMarkdown from "react-markdown";


const IssuesTable = ({ issues }: { issues: GitHubIssue[] }) => {
	return (
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
				{issues.length > 0
					? issues.map((issue) => {
							if (!issue) return null;
							return (
								<TableRow key={issue?.id}>
									<TableCell>
										{issue?.pull_request ? (
											"PR"
										) : (
											<CircleIcon
												className={`${
													issue?.state === "open"
														? "text-green-800"
														: "text-purple-800"
												}`}
											/>
										)}
									</TableCell>
									<TableCell className="truncate">{issue?.title}</TableCell>
									<TableCell>
										{issue?.closed_at
											? `closed ${humanReadableDate(issue.closed_at)}`
											: `opened ${humanReadableDate(issue.created_at)}`}
									</TableCell>
									<TableCell>{`last update ${humanReadableDate(
										issue?.updated_at,
									)}`}</TableCell>
									<TableCell className="max-w-[500px] h-10 truncate">
										<ReactMarkdown
											unwrapDisallowed
											allowedElements={["code", "strong", "emphasis"]}
										>
											{issue?.body}
										</ReactMarkdown>
									</TableCell>
								</TableRow>
							);
						})
					: null}
			</TableBody>
		</Table>
	);
};


export const PackagesPage = () => {
  const { data: deps } = useDependencies();

  const issuesQuery = useGitHubIssues({ dependencies: deps });

  const issues = useMemo(() => {
    return issuesQuery.flatMap((q) => {
      if (q.isSuccess) {
        return q?.data as GitHubIssue[];
      }
    });
  }, [issuesQuery]);

  // const issues = depsQuery.data
  //   ? depsQuery.data
  //       .map((dep) => {
  //         const { data } = useGitHubIssues({
  //           owner: dep.repository.owner,
  //           repo: dep.repository.repo,
  //         });
  //
  //         if (!data) return [];
  //         return data;
  //       })
  //       .flat()
  //       .filter((issue) => issue!)
  //   : [];

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
          {deps ? (
            deps?.map((dep) => {
              return (
                <Card key={dep.name}>
                  <CardHeader>
                    <CardTitle>{dep.name}</CardTitle>
                    <CardDescription>{dep.version}</CardDescription>
                  </CardHeader>
                  <CardContent></CardContent>
                </Card>
              );
            })
          ) : (
            <div>No dependencies discovered...</div>
          )}
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
              <IssuesTable issues={issues ?? []} />
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};
