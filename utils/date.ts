import { translate } from "@i18n";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
// Long term we should only import used locales
import { de, enUS, fr } from "date-fns/locale";
import { getLocales } from "react-native-localize";

const getLocale = () => {
  const locales = getLocales();
  if (locales.length > 0) {
    const { countryCode } = locales[0];
    if (countryCode === "US") return enUS;
    if (countryCode === "FR") return fr;
    if (countryCode === "DE") return de;
  }
  return enUS; // default locale
};

export const getRelativeDateTime = (date?: number | Date) => {
  if (!date) return "";
  let relativeDateTime = "";
  const days = differenceInCalendarDays(new Date(), date);
  const locale = getLocale();

  if (days === 0) {
    relativeDateTime = format(date, "p", { locale });
  } else if (days === 1) {
    relativeDateTime = "Yesterday";
  } else if (days < 7) {
    relativeDateTime = format(date, "EEEE", { locale });
  } else {
    relativeDateTime = format(date, "P", { locale });
  }
  return relativeDateTime;
};

export const getRelativeDate = (date?: number | Date) => {
  if (!date) return "";
  let relativeDateTime = "";
  const days = differenceInCalendarDays(new Date(), date);
  const locale = getLocale();

  if (days === 0) {
    relativeDateTime = translate("today");
  } else if (days === 1) {
    relativeDateTime = translate("yesterday");
  } else if (days < 7) {
    relativeDateTime = format(date, "EEEE", { locale });
  } else {
    relativeDateTime = format(date, "P", { locale });
  }
  return relativeDateTime;
};

export const getTime = (date: number | Date) => {
  if (!date) return "";
  const locale = getLocale();
  return format(date, "p", { locale });
};

export function normalizeTimestamp(timestamp: number) {
  // If the timestamp has more than 13 digits, assume it's in nanoseconds
  if (timestamp > 1e13) {
    return Math.floor(timestamp / 1e6); // Convert nanoseconds to milliseconds
  }
  return timestamp; // Already in milliseconds
}

export const getMinimalDate = (unnormalizedDate: number) => {
  if (!unnormalizedDate) return "";
  const date = normalizeTimestamp(unnormalizedDate);
  // To-do: Add supporting locale logic
  // const locale = getLocale();
  const diff = Date.now() - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.max(seconds, 0)}s`;
};

export const getLocalizedTime = (date: number | Date): string => {
  if (!date) return "";

  const locale = getLocale();
  const inputDate = new Date(date);

  return format(inputDate, "p", { locale });
};

export function getTodayNs() {
  return Date.now() * 1000000;
}

export function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000;
}
