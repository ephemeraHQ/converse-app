## SpecStory

## Limit Stack Trace Output in Logs (1/22/2025, 3:05:00 PM)

_**User**_

possible to only show like the first few lines of the stack?

---

_**Assistant**_

I'll help modify the code to only show the first few lines of the stack trace. Here's the update:

```typescript:queries/queryClient.ts
// ... existing code ...
      const stack = error instanceof Error ? error.stack : undefined;
      if (stack) {
        // Only show first 3 lines of stack trace for cleaner logs
        const firstFewLines = stack.split('\n').slice(0, 3).join('\n');
        console.error(`Query error stack trace:\n${firstFewLines}`);
      }
// ... existing code ...
```

I've modified the code to:
1. Split the stack trace by newlines
2. Take only the first 3 lines using `slice(0, 3)`
3. Join them back together with newlines

This will make the logs more concise while still providing the most relevant error information. Feel free to adjust the number of lines (currently set to 3) if you'd like to see more or fewer lines.

---



---

