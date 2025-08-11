import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localeData);

/**
 * Format a date as a relative time.
 * @example
 * ```ts
 * // today is 2025-07-19
 * formatRelativeTime("2025-07-19"); // "Today"
 * formatRelativeTime("2025-07-18"); // "Yesterday"
 * formatRelativeTime("2025-07-20"); // "Tomorrow"
 * formatRelativeTime("2025-07-15"); // "Last week"
 * formatRelativeTime("2025-07-01"); // "July 1, 2025"
 * ```
 */
export function formatRelativeTime(date: string | Date) {
  const selectedDate = dayjs(date);
  const today = dayjs();
  const yesterday = today.subtract(1, "day");
  const tomorrow = today.add(1, "day");

  if (selectedDate.isSame(today, "day")) {
    return "Today";
  } else if (selectedDate.isSame(yesterday, "day")) {
    return "Yesterday";
  } else if (selectedDate.isSame(tomorrow, "day")) {
    return "Tomorrow";
  }

  // For dates within the last week, show relative time
  const diffDays = Math.abs(selectedDate.diff(today, "day"));
  if (diffDays <= 7) {
    return selectedDate.fromNow();
  }
  // For older dates, show the full format
  return selectedDate.format("dddd, MMMM D, YYYY");
}

export { dayjs };
