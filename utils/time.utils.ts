import { hoursToMilliseconds, minutesToMilliseconds, secondsToMilliseconds } from "date-fns"

// Helper functions to create a fluent API
const createDays = (days: number) => ({
  toMilliseconds: () => days * 24 * 60 * 60 * 1000,
})

const createHours = (hours: number) => ({
  toMilliseconds: () => hoursToMilliseconds(hours),
})

const createMinutes = (minutes: number) => ({
  toMilliseconds: () => minutesToMilliseconds(minutes),
})

const createSeconds = (seconds: number) => ({
  toMilliseconds: () => secondsToMilliseconds(seconds),
})

// Re-export the functions we need
// This gives us a central place to manage time utilities
// and we can easily add our own helpers if needed
export const DateUtils = {
  seconds: createSeconds,
  days: createDays,
  hours: createHours,
  minutes: createMinutes,
} as const
