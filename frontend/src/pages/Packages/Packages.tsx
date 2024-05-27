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
import { useMemo, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/DataTable";
import Fuse from "fuse.js";

const IssuesTable = ({ issues }: { issues: GitHubIssue[] }) => {
  issues = issues.slice(0, 10); // limit to 10 for now
  return <DataTable columns={columns} data={issues} />;
};

export const PackagesPage = () => {
  const { data: deps } = useDependencies();

  const issuesQuery = useGitHubIssues({ dependencies: deps });

  const issues = useMemo(() => {
    return issuesQuery.flatMap((q) => {
      if (q.isSuccess) {
        return q?.data?.filter((issue: GitHubIssue) => {
          if (issue?.pull_request) {
            return false;
          }
          return true;
        }) as GitHubIssue[];
      }
    });
  }, [issuesQuery]);


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
