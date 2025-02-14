## SpecStory

## Limit Stack Trace to First 4 Lines (1/22/2025, 3:09:45 PM)

_**User**_

i just want like the first 4 lines of the stack trace

---

_**Assistant**_

I'll help modify the code to limit the stack trace to the first 4 lines. Here's the updated version:

```typescript:utils/capture-error.ts
// ... existing code ...
  if (options?.message) {
    const stack =
      getEnv() === "dev" && error instanceof Error
        ? `\nStack trace:\n${error.stack?.split('\n').slice(0, 4).join('\n')}`
        : "";
    logger.error(`${options.message}:`, error, stack);
  } else {
    const stack =
      getEnv() === "dev" && error instanceof Error
        ? `\nStack trace:\n${error.stack?.split('\n').slice(0, 4).join('\n')}`
        : "";
    logger.error(error, stack);
  }
// ... existing code ...
```

I've modified the stack trace generation by:
1. Adding optional chaining (`?.`) to safely handle cases where stack might be undefined
2. Using `split('\n')` to break the stack trace into lines
3. Using `slice(0, 4)` to take only the first 4 lines
4. Using `join('\n')` to recombine those lines with newline characters

This will give you a more concise stack trace while still maintaining the most relevant information from the error.

---



---

