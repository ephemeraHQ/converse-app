export const DateUtils = {
  days: {
    toMillis: (days: number) => days * 1000 * 60 * 60 * 24,
  },
} as const;
