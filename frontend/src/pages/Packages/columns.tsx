import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { GitHubIssue } from "@/lib/types";
import { humanReadableDate } from "@/utils/utils";
import ReactMarkdown from "react-markdown";

const columnHelper = createColumnHelper<GitHubIssue>();

export const columns: ColumnDef<GitHubIssue>[] = [
  {
    id: "type",
    header: "Type",
    accessorFn: (row) => (row.pull_request ? "PR" : "Issue"),
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Title",
  },
  {
    id: "opened/closed",
    accessorFn: (row) =>
      row.closed_at
        ? `closed ${humanReadableDate(row.closed_at)}`
        : `opened ${humanReadableDate(row.created_at)}`,
		header: "Opened/Closed",
  },
	{
		id:"body",
		accessorKey: "body",
		cell: (props) => {
      const body = props.getValue();
      return (
        <ReactMarkdown
          unwrapDisallowed
          allowedElements={["code", "strong", "emphasis"]}
        >
          {body ? (body as string) : ""}
        </ReactMarkdown>
      );
		}
	}
];
