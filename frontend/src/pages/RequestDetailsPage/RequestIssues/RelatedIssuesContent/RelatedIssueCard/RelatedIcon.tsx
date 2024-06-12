import IssueIcon from "./IssueIcon.svg";
import PullRequestIcon from "./PullRequestIcon.svg";

export function RelatedIcon(props: { isPr: boolean; isClosed: boolean }) {
  const { isPr, isClosed } = props;

  // TODO: handle other colors (like red for closed &unmerged prs)
  const className = isClosed ? "text-purple-500" : "text-green-400";

  if (isPr) {
    return <PullRequestIcon className={className} />;
  }

  return <IssueIcon className={className} />;
}
