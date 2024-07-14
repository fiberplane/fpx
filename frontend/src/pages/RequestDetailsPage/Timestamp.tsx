import { format } from "date-fns/format";
import { differenceInMilliseconds as calculateDifferenceInMilliseconds } from "date-fns/differenceInMilliseconds";

const HOUR = 3_600_000; /* 60 * 60 * 1000ms */
const DAY = HOUR * 24;

type Props = {
  date: string;
};

/**
 * Just render hh:mm:ss
 */
export function Timestamp(props: Props) {
  const parsedDate = new Date(props.date);

  const diffInMs = calculateDifferenceInMilliseconds(new Date(), parsedDate)
  const showTime = diffInMs < DAY;

  // If it's more than 24 hrs ago, render date
  const time = format(parsedDate, showTime ? "HH:mm:ss.SSS" : "LLLL d, HH:mm");

  if (!time) {
    return null;
  }

  return <span>{time}</span>;
}
