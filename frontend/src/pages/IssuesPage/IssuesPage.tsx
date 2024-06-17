import { DataTable } from "@/components/ui/DataTable";
import { IssueIconWithStatus } from "@/components/ui/IssueIconWithStatus";
import { CardSection } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDependencies, useGitHubIssues } from "@/queries/queries";
import { GithubIssue } from "@/queries/types";
import { ColumnDef, getPaginationRowModel } from "@tanstack/react-table";

import { useMemo, useState } from "react";
import { TimeAgo } from "../RequestDetailsPage/TimeAgo";

export function IssuesPage() {
  const { data, isLoading, isError } = useDependencies();
  const firstDependency = data?.[0].name;
  const [selected, setSelected] = useState<string>("");
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching dependencies</div>;
  }

  const current = selected || firstDependency;
  const item = data?.find((data) => data.name === current);
  const owner = item?.repository.owner;
  const repo = item?.repository.repo;

  return (
    <CardSection title="Issues" description="View issues for a dependency">
      <div className="flex gap-4 pb-6">
        <div className="font-semibold">Filter dependencies:</div>
        <RadioGroup
          defaultValue={current}
          className="inline-flex"
          onValueChange={(newValue) => {
            setSelected(newValue);
          }}
        >
          {data?.map((dependency) => (
            <div
              key={dependency.repository.url}
              className="inline-flex items-center space-x-2 fg-muted"
            >
              <RadioGroupItem
                value={dependency.name}
                id={`dependency-${dependency.name}`}
              />
              <Label htmlFor={`dependency-${dependency.name}`}>
                {dependency.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      {owner && repo && <Issues owner={owner} repo={repo} />}
    </CardSection>
  );
}

function Issues(props: { owner: string; repo: string }) {
  const { data, isError, isLoading } = useGitHubIssues(props.owner, props.repo);

  // Sort by created at
  const sortedData = useMemo(
    () =>
      data &&
      [...data].sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [data],
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading issues</div>;
  }

  if (!sortedData || sortedData.length === 0) {
    return <div>No issues</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={sortedData}
      getPaginationRowModel={getPaginationRowModel<GithubIssue>}
      handleRowClick={(row) => {
        window.open(row.original.url, "_blank");
      }}
    />
  );
}

const columns: Array<ColumnDef<GithubIssue>> = [
  {
    header: "Title",
    meta: {
      headerClassName: "pl-11",
    },
    cell: (props) => {
      return (
        <a
          href={props.row.original.url}
          target="_blank"
          rel="noreferrer"
          className="flex gap-4 items-center"
        >
          <IssueIconWithStatus
            isPr={props.row.original.url.includes("/pull/")}
            isClosed={!!props.row.original.closedAt}
            className="w-5 h-5"
          />
          <div className="grid items-center">
            <span className="font-medium text-lg">
              {props.row.original.title}
            </span>
            <span className="text-muted-foreground">
              #{props.row.original.id}
            </span>
          </div>
        </a>
      );
    },
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
    cell: (props) => {
      return <TimeAgo date={props.row.original.createdAt} />;
    },
  },
  {
    header: "Updated At",
    accessorKey: "updatedAt",
    cell: (props) => {
      return <TimeAgo date={props.row.original.updatedAt} />;
    },
  },
];
