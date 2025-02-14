## SpecStory

## Enhancing Sentry Error Tracking (2/14/2025, 10:51:09 AM)

_**User**_

i feel when i use sentryTrackError(props.rawMsg?.[0], props.rawMsg?.[1]); it's not really clean... like in Sentry I don't even see the "cause" of the error!! it'S like only the error message

---

_**Assistant**_

I'll help you improve the error tracking in Sentry. Let's modify how we handle error logging to provide better context and stack traces.

```typescript:utils/logger.ts
// ... existing code ...

const converseTransport: transportFunctionType = async (props) => {
  // Console logging in dev only
  if (isDev) {
    consoleTransport(props);
  }

  // Sentry logging
  if (props.level.severity >= LOG_LEVELS.error) {
    // Get the first argument which should be the error message or Error object
    const errorArg = props.rawMsg?.[0];
    
    // If it's an Error object, pass it directly to maintain stack trace
    // Otherwise, create a new Error with the message
    const error = errorArg instanceof Error ? 
      errorArg : 
      new Error(typeof errorArg === 'string' ? errorArg : JSON.stringify(errorArg));

    // Add any additional context from the second argument if it exists
    const context = props.rawMsg?.[1];
    if (context) {
      error.cause = context;
    }

    sentryTrackError(error);
  }

  // File logging
  if (loggingFilePath) {
    await RNFS.appendFile(loggingFilePath, `${props.msg}\n`, "utf8");
  }
};

// ... rest of the code ...
```

This change improves error tracking in several ways:

1. It properly handles both Error objects and string messages
2. Maintains stack traces when an Error object is passed
3. Adds additional context through the error.cause property
4. Ensures structured error reporting in Sentry

Now when you log errors, you can do it in these ways:

```typescript
// With an Error object (preferred)
logger.error(new Error("Something went wrong"), { userId: "123" });

// With a string message
logger.error("Something went wrong", { userId: "123" });
```

Both cases will now show up properly in Sentry with stack traces and additional context in the error.cause field.

Note: Make sure your `sentryTrackError` function in `utils/sentry.ts` is updated to expect a single Error parameter. You might need to update that file as well.

---

_**User**_

almost good but i feel the context thing isn'T good? like look in @sentry.ts the snetryTackError.

---

_**Assistant**_

Ah yes, I see the issue. The `sentryTrackError` function in `sentry.ts` expects a different structure. Let's modify the logger to match the expected interface:

```typescript:utils/logger.ts
// ... existing code ...

const converseTransport: transportFunctionType = async (props) => {
  // Console logging in dev only
  if (isDev) {
    consoleTransport(props);
  }

  // Sentry logging
  if (props.level.severity >= LOG_LEVELS.error) {
    // Get the first argument which should be the error message or Error object
    const errorArg = props.rawMsg?.[0];
    
    // If it's an Error object, pass it directly to maintain stack trace
    // Otherwise, create a new Error with the message
    const error = errorArg instanceof Error ? 
      errorArg : 
      new Error(typeof errorArg === 'string' ? errorArg : JSON.stringify(errorArg));

    // Get additional context from the second argument
    const context = props.rawMsg?.[1];

    sentryTrackError({
      error,
      extras: context && typeof context === 'object' ? context : undefined
    });
  }

  // File logging
  if (loggingFilePath) {
    await RNFS.appendFile(loggingFilePath, `${props.msg}\n`, "utf8");
  }
};

// ... rest of the code ...
```

Now when you log errors, you can do it like this:

```typescript
// With an Error object (preferred)
logger.error(new Error("Something went wrong"), { userId: "123", additionalContext: "some value" });

// With a string message
logger.error("Something went wrong", { userId: "123", additionalContext: "some value" });
```

This will properly pass the error and any additional context to Sentry using the expected interface from `sentryTrackError`. The context will appear in Sentry under the "Additional Data" section of the error event.

---

_**User**_

what does "enableAutoPerformanceTracing" do?

---

_**Assistant**_

`enableAutoPerformanceTracing` is a Sentry configuration option that automatically tracks performance metrics in your React Native application. When enabled, it:

1. Automatically creates transactions for:
   - App start/launch time
   - Screen/route changes (navigation)
   - React component mount/unmount timings
   - Network requests (fetch/XHR)

2. Provides insights about:
   - Time to first paint/render
   - JavaScript execution time
   - Resource loading times
   - UI response times

Here's a practical example of what it captures:
```typescript
// This navigation action would be automatically traced
navigation.navigate('Profile');

// This API call would be automatically traced
fetch('https://api.example.com/data');

// Component mounting/rendering would be traced
function ProfileScreen() {
  // Sentry will track how long this component takes to mount and render
  return <View>...</View>;
}
```

The data appears in Sentry's Performance monitoring section, where you can:
- See performance trends over time
- Identify slow transactions
- Debug performance bottlenecks
- Monitor app responsiveness

Setting `tracesSampleRate: 1.0` means it captures 100% of transactions. In production, you might want to lower this value (e.g., 0.1 for 10% sampling) to reduce data volume.

---

_**User**_

wha aabout "attachViewHierarchy"

---

_**Assistant**_

`attachViewHierarchy` is a Sentry configuration option that captures the React component tree structure when an error occurs. This helps with debugging by showing you exactly what the UI looked like when the error happened.

For example, if you have a structure like this:

```typescript
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home">
          <HomeScreen>
            <ProfileCard /> {/* Error happens here */}
            <FeedList />
          </HomeScreen>
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

When an error occurs in `ProfileCard`, Sentry will show you the entire component tree above, making it easier to:

1. Understand the context of where the error occurred
2. See which components were mounted at the time
3. View the component hierarchy that led to the error
4. Debug navigation-related issues by showing the current navigation state

This is particularly useful in React Native apps because:
- You can't easily inspect the UI on users' devices
- Stack traces alone might not give enough context about the UI state
- Navigation-related bugs can be hard to reproduce without knowing the exact screen hierarchy

The data appears in Sentry under the "View Hierarchy" tab of the error details, showing an interactive tree of your components at the time of the crash.

Note: While very useful for debugging, this feature does increase the size of error reports sent to Sentry, so you might want to disable it in production if payload size is a concern.

---



---

