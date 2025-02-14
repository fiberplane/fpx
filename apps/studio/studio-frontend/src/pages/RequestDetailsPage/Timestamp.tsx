import { differenceInMilliseconds as calculateDifferenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { format } from "date-fns/format";

const HOUR = 3_600_000; /* 60 * 60 * 1000ms */
const DAY = HOUR * 24;

type Props = {
  date: string;
  className?: string;
};

/**
 * Just render hh:mm:ss for anything in past 24hrs
 *
 * Anything over 24hrs ago, render date
 */
export function Timestamp(props: Props) {
  const { date, className } = props;
  const parsedDate = new Date(date);

  const diffInMs = calculateDifferenceInMilliseconds(new Date(), parsedDate);
  const showTime = diffInMs < DAY;

  // If it's more than 24 hrs ago, render date
  const time = format(parsedDate, showTime ? "HH:mm:ss.SSS" : "LLLL d, HH:mm");

  if (!time) {
    return null;
  }

  return <span className={className}>{time}</span>;
}
