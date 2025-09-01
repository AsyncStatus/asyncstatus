import { dayjs } from "@asyncstatus/dayjs";

export const getDateRange = (filters: string) => {
  const [start, end] = filters.split("..");
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!startDate.isValid() || !endDate.isValid()) {
    return undefined;
  }
  return { start: startDate, end: endDate };
};

export const getCommitRange = (filters: string) => {
  const [start, end] = filters.split("..");
  const startCommit = start;
  const endCommit = end;
  if (
    !startCommit ||
    !endCommit ||
    startCommit.length < 7 ||
    startCommit.length > 40 ||
    endCommit.length < 7 ||
    endCommit.length > 40 ||
    dayjs(startCommit).isValid() ||
    dayjs(endCommit).isValid()
  ) {
    return undefined;
  }
  return { start: startCommit, end: endCommit };
};
