## SpecStory

## Configuring onError in Query Client (1/14/2025, 1:56:14 PM)

_**User**_

where can i put onerror: ..

---

_**Assistant**_

Based on the code snippets provided, you can add the `onError` handler in the `queryClient` configuration in `queries/queryClient.ts`. Here's how to modify the file:

```typescript:queries/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from "./queryClient.constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // libXmtp handles retries
      retryOnMount: false, // Prevent infinite refetch loops by manually controlling when queries should retry on component mount
      gcTime: DEFAULT_GC_TIME,
      staleTime: DEFAULT_STALE_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      structuralSharing: false,
      // Add global error handling for queries
      onError: (error) => {
        // Handle query errors here
        console.error('Query error:', error);
      }
    },
    mutations: {
      // Add global error handling for mutations if needed
      onError: (error) => {
        // Handle mutation errors here
        console.error('Mutation error:', error);
      }
    }
  },
});
```

You can add `onError` handlers in two places:
1. Under `queries` for handling query errors globally
2. Under `mutations` for handling mutation errors globally

Both will be applied to all queries/mutations unless overridden by individual query/mutation configurations.

Remember to replace the `console.error` with your preferred error handling logic, such as showing a toast notification or logging to a service.

---



---

