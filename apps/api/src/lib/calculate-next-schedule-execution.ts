import { dayjs } from "@asyncstatus/dayjs";
import type { Schedule } from "../db";

export function calculateNextScheduleExecution(schedule: Schedule): Date | null {
  const now = dayjs().tz(schedule.config.timezone);
  const [hours, minutes] = schedule.config.timeOfDay.split(":").map(Number) as [number, number];

  switch (schedule.config.recurrence) {
    case "daily": {
      let nextDaily = now.hour(hours).minute(minutes).second(0);
      if (nextDaily.isBefore(now)) {
        nextDaily = nextDaily.add(1, "day");
      }
      return nextDaily.utc().toDate();
    }

    case "weekly": {
      let nextWeekly = now
        .day(schedule.config.dayOfWeek ?? 0)
        .hour(hours)
        .minute(minutes)
        .second(0);
      if (nextWeekly.isBefore(now)) {
        nextWeekly = nextWeekly.add(1, "week");
      }
      return nextWeekly.utc().toDate();
    }

    case "monthly": {
      let nextMonthly = now
        .date(schedule.config.dayOfMonth ?? 1)
        .hour(hours)
        .minute(minutes)
        .second(0);
      if (nextMonthly.isBefore(now)) {
        nextMonthly = nextMonthly.add(1, "month");
      }
      return nextMonthly.utc().toDate();
    }

    default:
      return null;
  }
}
