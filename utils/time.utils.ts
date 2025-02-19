export const DateUtils = {
  days: {
    toMilliseconds: (days: number) => days * 1000 * 60 * 60 * 24,
  },
  hours: {
    toMilliseconds: (hours: number) => hours * 1000 * 60 * 60,
  },
  minutes: {
    toMilliseconds: (minutes: number) => minutes * 1000 * 60,
  },
} as const;
