import { format } from "date-fns";

/**
 * Format a date in a specific timezone using the browser's Intl API
 */
export function formatInTimezone(
  date: Date | string | number,
  timezone: string,
  formatStr: string = "yyyy-MM-dd HH:mm:ss",
): string {
  const d = new Date(date);

  // Use Intl.DateTimeFormat to get the date in the specified timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(d);

  const dateObj: any = {};
  parts.forEach((part) => {
    dateObj[part.type] = part.value;
  });

  // Reconstruct the date string in a format that Date.parse can understand
  const dateStr = `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`;

  // Format using date-fns
  return format(new Date(dateStr), formatStr);
}

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(
  date: Date | string | number,
  fromTimezone: string,
  toTimezone: string,
): Date {
  const d = new Date(date);

  // Get the date string in the source timezone
  const sourceFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: fromTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const sourceParts = sourceFormatter.formatToParts(d);
  const sourceObj: any = {};
  sourceParts.forEach((part) => {
    sourceObj[part.type] = part.value;
  });

  // Create a date string
  const sourceDateStr = `${sourceObj.year}-${sourceObj.month}-${sourceObj.day}T${sourceObj.hour}:${sourceObj.minute}:${sourceObj.second}`;

  // Now format in the target timezone
  const targetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: toTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return new Date(targetFormatter.format(new Date(sourceDateStr)));
}
