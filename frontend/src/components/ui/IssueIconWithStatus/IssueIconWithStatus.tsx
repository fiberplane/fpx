import clsx from "clsx";

import IssueIcon from "./IssueIcon.svg";
import PullRequestIcon from "./PullRequestIcon.svg";

export function IssueIconWithStatus(props: {
  isPr: boolean;
  isClosed: boolean;
  className?: string;
}) {
  const { isPr, isClosed, className } = props;

  // TODO: handle other colors (like red for closed &unmerged prs)
  const colorClassName = isClosed ? "text-purple-500" : "text-green-600";

  if (isPr) {
    return <PullRequestIcon className={clsx(className, colorClassName)} />;
  }

  return <IssueIcon className={clsx(className, colorClassName)} />;
}
