import dayjs, { Dayjs } from "dayjs";

export function toPublishedAt(date: Date | null): Dayjs | null {
  return date ? dayjs(date) : null;
}
