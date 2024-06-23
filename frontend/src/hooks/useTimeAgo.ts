import { differenceInMilliseconds as calculateDifferenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { useEffect, useRef, useState } from "react";

// In ms
const FIVE_SECONDS = 5000;
const TEN_SECONDS = 10_000;
const HALF_MINUTE = 30_000;
const MINUTE = 60_000; /* 60 * 1000ms */
const HOUR = 3_600_000; /* 60 * 60 * 1000ms */
const DAY = 86_400_000; /* 24 hours, 24 * 60 * 60 * 1000ms */

// By defining the intervals this way, we can determine which interval should
// be applied in a time window. This allows us to give more descriptive readable
// time strings as defined in the `date-fns` documentation:
// https://date-fns.org/v2.29.2/docs/formatDistanceToNow
const INTERVALS = {
  [FIVE_SECONDS]: {
    interval: FIVE_SECONDS,
    nextInterval: HALF_MINUTE,
  },
  [HALF_MINUTE]: {
    interval: TEN_SECONDS,
    nextInterval: MINUTE,
  },
  [MINUTE]: {
    interval: MINUTE,
    nextInterval: HOUR,
  },
  [HOUR]: {
    interval: HOUR,
    nextInterval: DAY,
  },
} as const;

/**
 * Hook that parses the date string into a human-readable string that updates
 * based on the right interval. If the comment is submitted >= 24hrs ago a
 * string with that date will be returned that won't be updated.
 *
 * if the strict option is set to true the helpers like 'almost', 'over', 'less than' and the like
 * aren't used.
 */
export function useTimeAgo(
  date: string | undefined,
  options?: { strict: boolean },
) {
  const { strict = false } = options || {};

  const interval = useRef<(typeof INTERVALS)[keyof typeof INTERVALS]>(
    INTERVALS[FIVE_SECONDS],
  );
  const [formattedDate, setFormattedDate] = useState<string>();

  useEffect(() => {
    if (!date) {
      return;
    }

    const parsedDate = new Date(date);

    const getDifferenceInMilliseconds = () =>
      calculateDifferenceInMilliseconds(new Date(), parsedDate);

    const setFormatDate = () => {
      const formatter = strict
        ? formatDistanceToNowStrict
        : formatDistanceToNow;
      const formattedDate = formatter(parsedDate, {
        addSuffix: true,
        includeSeconds: true,
      });
      setFormattedDate(formattedDate);
    };

    const setConstantDate = () => {
      const constantDate = format(parsedDate, "LLLL d, yyyy");
      setFormattedDate(constantDate);
    };

    // Prevent calling the timeout when we know >= 24hrs has passed & set a
    // formatted post date string.
    if (getDifferenceInMilliseconds() >= DAY) {
      setConstantDate();
      return;
    }

    let formatTimeout: ReturnType<typeof setTimeout>;
    const setFormatTimeout = () => {
      formatTimeout = setTimeout(() => {
        const differenceInMilliSeconds = getDifferenceInMilliseconds();
        // Prevent calling a new timeout when we know >= 24hrs has passed & set
        // a formatted post date string.
        if (differenceInMilliSeconds >= DAY) {
          setConstantDate();
          return;
        }

        if (differenceInMilliSeconds >= interval.current.nextInterval) {
          if (interval.current.nextInterval === DAY) {
            setConstantDate();
            return;
          }

          interval.current = INTERVALS[interval.current.nextInterval];
        }

        setFormatDate();
        setFormatTimeout();
      }, interval.current.interval);
    };

    setFormatDate();
    setFormatTimeout();

    return () => {
      clearTimeout(formatTimeout);
    };
  }, [date, strict]);

  return formattedDate;
}
