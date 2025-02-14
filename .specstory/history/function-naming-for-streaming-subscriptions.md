## SpecStory

## Function Naming for Streaming Subscriptions (1/28/2025, 2:33:37 PM)

_**User**_

is "startStreamsSubscription" good? Or somethign else

---

_**Assistant**_

Based on the code style guide and the function's purpose, I'd suggest renaming it to `setupStreamingSubscriptions`. Here's why:

1. The function doesn't just "start" subscriptions - it sets up listeners that will start/stop streams based on different conditions (internet connectivity, app state, etc.)
2. The word "setup" better describes that this is an initialization function that configures the streaming behavior
3. Using "Streaming" instead of "Streams" is more consistent with the other function names in the file (like `startStreaming`, `stopStreaming`)
4. Using plural "Subscriptions" is more accurate since it sets up multiple subscribers

Here's how to update the code:

```typescript:features/streams/streams.ts
// ... existing code ...
export function setupStreamingSubscriptions() {
// ... existing code ...
```

This name better reflects what the function actually does - it sets up the subscription handlers that manage the streaming lifecycle based on app state and connectivity changes.

---



---

