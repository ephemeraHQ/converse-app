import { isToday as _isToday, isYesterday } from "date-fns"
import differenceInCalendarDays from "date-fns/differenceInCalendarDays"
import format from "date-fns/format"
// Long term we should only import used locales
import { de, enUS, fr } from "date-fns/locale"
import { getLocales } from "react-native-localize"

const getLocale = () => {
  const locales = getLocales()
  if (locales.length > 0) {
    const { countryCode } = locales[0]
    if (countryCode === "US") return enUS
    if (countryCode === "FR") return fr
    if (countryCode === "DE") return de
  }
  return enUS // default locale
}

export const getRelativeDateTime = (date?: number | Date) => {
  if (!date) return ""
  let relativeDateTime = ""
  const days = differenceInCalendarDays(new Date(), date)
  const locale = getLocale()

  if (days === 0) {
    relativeDateTime = format(date, "p", { locale })
  } else if (days === 1) {
    relativeDateTime = "Yesterday"
  } else if (days < 7) {
    relativeDateTime = format(date, "EEEE", { locale })
  } else {
    relativeDateTime = format(date, "P", { locale })
  }
  return relativeDateTime
}

export const getTime = (date: number | Date) => {
  if (!date) return ""
  const locale = getLocale()
  return format(date, "p", { locale })
}

export function normalizeTimestampToMs(timestamp: number) {
  // If the timestamp has more than 13 digits, assume it's in nanoseconds
  if (timestamp > 1e13) {
    return Math.floor(timestamp / 1e6) // Convert nanoseconds to milliseconds
  }
  return timestamp // Already in milliseconds
}

export const getCompactRelativeTime = (unnormalizedDate: number) => {
  if (!unnormalizedDate) return ""
  const date = normalizeTimestampToMs(unnormalizedDate)
  // To-do: Add supporting locale logic
  // const locale = getLocale();
  const diff = Date.now() - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}y`
  if (months > 0) return `${months}mo`
  if (weeks > 0) return `${weeks}w`
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  if (seconds === 0) return "0s"
  return `${Math.max(seconds, 0)}s`
}

export const getLocalizedTime = (date: number | Date): string => {
  if (!date) return ""

  const locale = getLocale()
  const inputDate = new Date(date)

  return format(inputDate, "p", { locale })
}

export function getTodayNs() {
  return Date.now() * 1000000
}

export function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000
}

export function convertMillisecondsToNanoseconds(ms: number) {
  return ms * 1000000
}

export function isToday(timestamp: number) {
  return _isToday(new Date(timestamp))
}

export function getRelativeDate(timestamp: number): string {
  if (!timestamp) {
    return ""
  }

  const date = new Date(timestamp)
  const now = new Date()
  const diffInDays = differenceInCalendarDays(now, date)
  const locale = getLocale()

  // For messages from today
  if (_isToday(date)) {
    return "Today"
  }

  // For messages from yesterday
  if (isYesterday(date)) {
    return "Yesterday"
  }

  // For messages within the last 7 days
  if (diffInDays < 7) {
    return format(date, "EEEE", { locale }) // Returns day name (Monday, Tuesday, etc.)
  }

  // For older messages
  return format(date, "MMM d", { locale }) // Returns "Jan 15" format
}
