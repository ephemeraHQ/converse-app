## SpecStory

## Fixing JSX Props Function Error (11/12/2024, 8:48:30 AM)

_**User**_

For the code present, we get this error:
```
JSX props should not use functions
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because we're passing a function directly as a prop. To fix this, we should memoize the handler using `useCallback`. Here's the fix:

```typescript:design-system/TextField/TextField.tsx
// ... existing code ...
const handleFocusCallback = useCallback(() => {
  handleFocus()
}, [handleFocus])

// ... existing code ...
      style={themed($containerStyles)}
      onPress={handleFocusCallback}
      accessibilityState={{ disabled }}
// ... existing code ...
```

Make sure to import `useCallback` from React at the top of your file if not already present.

This memoizes the function and prevents unnecessary re-renders, which is what the linting rule is trying to enforce.

---



---

