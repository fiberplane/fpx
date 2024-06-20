import { useTimeAgo } from "../../hooks";

type Props = {
  date: string,
  /**
   * If true, will fallback to the date if the time is more than an hour ago.
   */
  fallbackWithDate?: boolean,
  /**
   * If true, will fallback to the time if the time is more than an hour ago.
   * 
   * if both are set to true both time & date are shown
   */
  fallbackWithTime?: boolean
};
export function TimeAgo(props: Props) {
  const { date, fallbackWithDate = true, fallbackWithTime = true } = props;
  const time = useTimeAgo(date, { strict: false, fallbackWithTime, fallbackWithDate });

  if (!time) {
    return null;
  }

  return <span>{time}</span>;
}
