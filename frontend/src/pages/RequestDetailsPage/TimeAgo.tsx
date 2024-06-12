import { useTimeAgo } from "../../hooks";

export function TimeAgo(props: { date: string }) {
  const time = useTimeAgo(props.date);

  if (!time) {
    return null;
  }

  return <span>{time}</span>;
}
