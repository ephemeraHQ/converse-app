import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";

export const getRelativeDateTime = (date?: number | Date) => {
  if (!date) return "";
  let relativeDateTime = "";
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) {
    relativeDateTime = format(date, "hh:mm aa");
  } else if (days === 1) {
    relativeDateTime = "Yesterday";
  } else if (days < 7) {
    relativeDateTime = format(date, "EEEE");
  } else {
    relativeDateTime = format(date, "yyyy-MM-dd");
  }
  return relativeDateTime;
};

export const getRelativeDate = (date?: number | Date) => {
  if (!date) return "";
  let relativeDateTime = "";
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) {
    relativeDateTime = "Today";
  } else if (days === 1) {
    relativeDateTime = "Yesterday";
  } else if (days < 7) {
    relativeDateTime = format(date, "EEEE");
  } else {
    relativeDateTime = format(date, "yyyy-MM-dd");
  }
  return relativeDateTime;
};
