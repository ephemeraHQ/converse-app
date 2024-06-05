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
    relativeDateTime = "Today";
  } else if (days === 1) {
    relativeDateTime = "Yesterday";
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
