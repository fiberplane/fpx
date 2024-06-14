import { GithubIssue } from "@/queries/types";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { memo, useMemo } from "react";

import { IssueIconWithStatus } from "../../../../../components/ui/IssueIconWithStatus";
import { TimeAgo } from "../../../TimeAgo";
import { getChunks } from "./utils";

type Props = Pick<
  GithubIssue,
  | "body"
  | "title"
  | "createdAt"
  | "updatedAt"
  | "closedAt"
  | "owner"
  | "repo"
  | "url"
> & { searchWords: Array<string> };

export const RelatedIssueCard = memo(function RelatedIssueCard({
  searchWords,
  ...issue
}: Props) {
  const body = issue.body ?? "";
  const chunks = useMemo(() => {
    return getChunks(body, searchWords);
  }, [body, searchWords]);

  return (
    <a href={issue.url} className="block" target="_blank" rel="noreferrer">
      <div className="py-6 px-4 -mx-4 rounded-sm hover:bg-neutral-100">
        <div className="flex items-center justify-between">
          <div className="truncate text-sm font-medium flex gap-1 items-center">
            <IssueIconWithStatus
              isPr={issue.url.includes("/pull/")}
              isClosed={!!issue.closedAt}
            />

            {issue.title}
          </div>
          <div className="ml-2 flex flex-shrink-0 text-gray-500 items-center gap-1">
            <GitHubLogoIcon />
            <span className="flex gap-1">
              <span>{issue.owner}</span>
              <span>/</span>
              <span>{issue.repo}</span>
            </span>
          </div>
        </div>
        <div>
          {chunks.map((chunk, index) => {
            const section = body?.substring(chunk.start, chunk.end) || "";
            if (chunk.highlight === false) {
              return <span key={index}>{section}</span>;
            }

            return (
              <span
                key={index}
                className="bg-yellow-100 rounded-sm inline-block px-1"
              >
                {section}
              </span>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <div className="sm:flex">
            <div className="mr-4 flex items-center text-sm text-gray-500">
              Created: <TimeAgo date={issue.createdAt} />
            </div>
            {issue.updatedAt &&
              (issue.updatedAt !== issue.createdAt ||
                issue.updatedAt !== issue.closedAt) && (
                <div className="mr-4 flex items-center text-sm text-gray-500">
                  Updated: <TimeAgo date={issue.updatedAt} />
                </div>
              )}
            {issue.closedAt && (
              <div className="mr-4 flex items-center text-sm text-gray-500">
                Closed: <TimeAgo date={issue.closedAt} />
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
});
