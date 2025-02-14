## SpecStory

## Fixing Loader Size in React Native (1/17/2025, 10:06:27 AM)

_**User**_

there's no way to make the loader small right?

---

_**Assistant**_

Looking at the code, the Loader component (which wraps React Native's ActivityIndicator) actually does support a "small" size through its props. The issue in the code snippet is that the condition for showing the loader is reversed. Here's the fix:

```typescript:features/conversation-list/conversation-list-awaiting-requests.tsx
// ... existing code ...
    const title = isLoading ? (  // Changed from !isLoading
      <Loader
        size="small"
        style={{
          alignSelf: "flex-start",
        }}
      />
    ) : (
      "Requests"
    );
// ... existing code ...
```

The issue was that the condition `!isLoading` was showing the loader when NOT loading, and showing "Requests" when loading. By removing the `!`, it will now show the loader when `isLoading` is true, and "Requests" when it's false.

The `size="small"` prop is correctly specified and should work as expected with this fix.

---



---

