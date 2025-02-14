## SpecStory

## Resolving JSX Props Function Error (11/12/2024, 8:49:22 AM)

_**User**_

For the code present, we get this error:
```
JSX props should not use functions
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because we're passing the `onFocus` function directly as a prop. In React Native, it's recommended to memoize function props to prevent unnecessary re-renders.

Here's how to fix it:

```typescript:design-system/TextField/TextField.tsx
// ... existing code ...
      style={themed($containerStyles)}
      onPress={useCallback(onFocus, [])}
      accessibilityState={{ disabled }}
// ... existing code ...
```

Add this import at the top of your file if not already present:
```typescript
import { useCallback } from 'react'
```

This memoizes the `onPress` handler and should resolve the linting error.

---



---

