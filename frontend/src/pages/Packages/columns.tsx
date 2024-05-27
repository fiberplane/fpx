import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { GitHubIssue } from "@/lib/types";
import { humanReadableDate } from "@/utils/utils";
import ReactMarkdown from "react-markdown";
import { ShadowInnerIcon } from "@radix-ui/react-icons";

const columnHelper = createColumnHelper<GitHubIssue>();

export const columns: ColumnDef<GitHubIssue>[] = [
  {
    id: "type",
    header: "Type",
    accessorFn: (row) => (row?.pull_request ? "pr" : "issue"),
    cell: (props) => {
      {
        return props?.getValue() === "pr" ? (
          <>PR</>
        ) : (
          <ShadowInnerIcon
            className={`h-3.5 w-3.5 ${
              props?.row?.original?.state === "open"
                ? "text-green-800"
                : "text-purple-800"
            }`}
          />
        );
      }
    },
  },
  {
    id: "title",
    accessorFn: (row) => row?.title ?? "",
    header: "Title",
    cell: ({ row }) => {
      return (
        <div>
          <h4 className="font-semibold">{row?.getValue("title")}</h4>
          <p>
            {row?.original?.updated_at
              ? `last updated ${humanReadableDate(row?.original?.updated_at)}`
              : ""}
          </p>
        </div>
      );
    },
  },
  {
    id: "opened/closed",
    accessorFn: (row) =>
      row
        ? row?.closed_at
          ? `closed ${humanReadableDate(row?.closed_at)}`
          : `opened ${humanReadableDate(row?.created_at)}`
        : "",
    header: "Opened/Closed",
  },
  {
    id: "body",
		header: "Preview",
    accessorFn: (row) => row?.body ?? "",
    meta: {
      cellClassName: "truncate overflow-hidden max-w-[500px]",
    },
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
    },
  },
];
