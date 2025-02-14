## SpecStory

## Controlling Recursion Depth in Function (12/18/2024, 11:04:25 AM)

_**User**_

fix so that if level is 0 we don'T recursive, but if level 1 we can recursive once

---

_**Assistant**_

I'll help modify the function to respect the `level` parameter for controlling recursion depth. Here's the updated version:

```typescript:utils/mutate-object-properties.ts
export function mutateObjectProperties<T>(
  object: T,
  properties: Partial<T>,
  level: number = 0
): T {
  for (const [key, newValue] of Object.entries(properties) as [
    keyof T,
    T[keyof T],
  ][]) {
    if (isPlainObject(newValue) && level > 0) {
      const existingValue = object[key];
      if (isPlainObject(existingValue)) {
        mutateObjectProperties(
          existingValue as NestedObject,
          newValue as Partial<NestedObject>,
          level - 1
        );
      } else {
        object[key] = newValue as T[keyof T];
      }
    } else {
      object[key] = newValue;
    }
  }

  return object;
}
```

Key changes made:
1. Added `level > 0` check in the first `if` condition to only allow recursion when level is greater than 0
2. Pass `level - 1` to recursive calls to decrement the level counter
3. When `level` is 0 or we have a non-object value, we simply assign the new value directly

Now:
- With `level = 0`: Only updates top-level properties, no recursion
- With `level = 1`: Updates top-level properties and allows one level of recursion
- With `level = 2`: Would allow recursion up to two levels deep, and so on

---



---

