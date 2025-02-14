export const DateUtils = {
  days: {
    toMilliseconds: (days: number) => days * 1000 * 60 * 60 * 24,
  },
  minutes: {
    toMilliseconds: (minutes: number) => minutes * 1000 * 60,
  },
} as const;
