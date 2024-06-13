import { DataTable } from "@/components/ui/DataTable";
import { useDependencies, useGitHubIssues } from "@/queries/queries";
import { GithubIssue } from "@/queries/types";
import { ColumnDef, getPaginationRowModel } from "@tanstack/react-table";
import { useState } from "react";
import { IssueSection } from "../RequestDetailsPage/RequestIssues/RelatedIssuesContent/IssueSection";

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
    <IssueSection title="Issues" description="View issues for a dependency">
      <div className="flex gap-4 py-4">
        <div className="font-bold">Filter dependencies:</div>
        <ul className="flex gap-4">
          {data?.map((dependency) => (
            <li key={dependency.repository.url}>
              <label className="flex gap-1">
                <input
                  type="radio"
                  value={dependency.name}
                  name="dependency"
                  defaultChecked={dependency.name === current}
                  onChange={() => {
                    console.log(".s.dfsdfs", current, dependency.name);
                    setSelected(dependency.name);
                  }}
                />
                {dependency.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
      {owner && repo && <Issues owner={owner} repo={repo} />}
    </IssueSection>
  );
}

function Issues(props: { owner: string; repo: string }) {
  const { data, isError, isLoading } = useGitHubIssues(props.owner, props.repo);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading issues</div>;
  }

  if (!data || data.length === 0) {
    return <div>No issues</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      getPaginationRowModel={getPaginationRowModel<GithubIssue>}
    />
  );
}

const columns: Array<ColumnDef<GithubIssue>> = [
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "State",
    accessorKey: "state",
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
  },
  {
    header: "Updated At",
    accessorKey: "updatedAt",
  },
];
