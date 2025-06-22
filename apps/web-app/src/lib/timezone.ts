import { format, formatInTimeZone } from "date-fns-tz";

/**
 * Format a date in the user's timezone
 * @param date - The date to format (in UTC)
 * @param timezone - The user's timezone (IANA identifier)
 * @param formatStr - The format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns The formatted date string
 */
export function formatDateInTimezone(
  date: Date | string | number,
  timezone: string,
  formatStr: string = "yyyy-MM-dd HH:mm:ss"
): string {
  return formatInTimeZone(new Date(date), timezone, formatStr);
}

/**
 * Get a human-readable timezone offset
 * @param timezone - The timezone (IANA identifier)
 * @returns The offset string (e.g., "UTC+5:30")
 */
export function getTimezoneOffset(timezone: string): string {
  const date = new Date();
  const offset = formatInTimeZone(date, timezone, "XXX"); // e.g., "+05:30"
  return `UTC${offset}`;
}

/**
 * Common timezone options for select dropdowns
 */
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "America/Honolulu", label: "Hawaii" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "Mumbai, Kolkata, New Delhi" },
  { value: "Asia/Shanghai", label: "Beijing, Shanghai" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

/**
 * Get the browser's timezone
 * @returns The browser's timezone (IANA identifier)
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}