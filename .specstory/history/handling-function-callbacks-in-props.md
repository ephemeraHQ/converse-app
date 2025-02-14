## SpecStory

## Handling Function Callbacks in Props (11/14/2024, 10:51:39 AM)

_**User**_

 if (typeof matchedPattern[key] === 'function') {
        // Support onPress / onLongPress functions
        props[key] = () => matchedPattern[key](text, index);
      } else {
        // Set a prop with an arbitrary name to the value in the match-config
        props[key] = matchedPattern[key];
      }

---

_**Assistant**_

Let me help clean up that `onPress` handler section. Here's the corrected version that properly handles the function callback:

```typescript:components/ParsedText/ParsedText.utils.ts
// ... existing code ...
      if (key === "onPress") {
        acc[key] = typeof value === "function" ? () => value(text, index) : value;
      } else {
        acc[key] = value;
      }
// ... existing code ...
```

The changes:
1. Removed the unnecessary `if(value)` check
2. Added a type check to ensure `value` is a function before creating the callback
3. If `value` isn't a function, we pass it through directly

This maintains the functionality while being more type-safe and concise. The code will now properly handle both function callbacks and static values for the `onPress` prop.

---



---

