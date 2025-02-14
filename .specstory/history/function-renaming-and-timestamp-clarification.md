## SpecStory

## Function Renaming and Timestamp Clarification (1/13/2025, 9:01:52 AM)

_**User**_

what could I rename this? And also what is unomralizeDate? A number but like seconds, ms, ns?

---

_**Assistant**_

Based on the code context, `getMinimalDate` is actually returning a relative time in a compact format (like "2y", "3mo", "5d", etc.). A better name would be `getCompactRelativeTime` or `getShortRelativeTime`.

As for `unnormalizedDate`, looking at the `normalizeTimestamp` function in the same file, it's handling timestamps that could be in either:
- Milliseconds (13 digits or less)
- Nanoseconds (more than 13 digits)

Here's how I would update the function name and parameter type:

```typescript:utils/date.ts
export const getCompactRelativeTime = (timestampInNsOrMs: number) => {
  if (!timestampInNsOrMs) return "";
  const timestampInMs = normalizeTimestamp(timestampInNsOrMs);
  // ... rest of the function ...
};
```

This makes it clearer that:
1. The function returns a compact relative time string
2. The input parameter can be either a nanosecond or millisecond timestamp that will be normalized internally

This naming also better aligns with the other time-related functions in the file like `getRelativeDateTime` and `getRelativeDate`.

---



---

