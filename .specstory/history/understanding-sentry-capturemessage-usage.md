## SpecStory

## Understanding Sentry.captureMessage Usage (2/14/2025, 10:17:30 AM)

_**User**_

in which case would we use sentryCaptureMessage? What's the point of this?

---

_**Assistant**_

Let me explain when to use `sentryTrackMessage` (which uses `Sentry.captureMessage`):

`Sentry.captureMessage` is used for tracking significant events or states that aren't errors but are important enough to monitor. Here are the main use cases:

1. **Important Application State Changes**
```typescript
// Example: Tracking when critical features are enabled/disabled
sentryTrackMessage("Push notifications disabled by user", { 
  reason: "user_preference",
  deviceType: "ios" 
});
```

2. **Business-Critical Events**
```typescript
// Example: Tracking important user actions
sentryTrackMessage("User exceeded rate limit", {
  attemptCount: 15,
  timeWindow: "1hour"
});
```

3. **Warning Conditions**
```typescript
// Example: When something unexpected (but not error-worthy) happens
sentryTrackMessage("API response time exceeded threshold", {
  responseTime: 5000,
  endpoint: "/api/messages"
});
```

4. **Debugging Complex Flows**
```typescript
// Example: Tracking state in complex user flows
sentryTrackMessage("User dropped off during onboarding", {
  completedSteps: ["profile", "verification"],
  currentStep: "payment",
});
```

The key difference between `sentryTrackError` and `sentryTrackMessage`:
- `sentryTrackError`: For actual errors and exceptions that need investigation
- `sentryTrackMessage`: For important events/states that you want to monitor but aren't errors

I would suggest updating the code to use our logger instead of console.log:

```typescript:utils/sentry.ts
// ... existing code ...

export function sentryTrackMessage(
  message: string,
  extras: Record<string, unknown> = {}
) {
  logger.debug(`[Sentry] ${message}`, extras);
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureMessage(message);
  });
}

// ... rest of the file ...
```

This aligns better with our logging standards while maintaining the same functionality.

---



---

