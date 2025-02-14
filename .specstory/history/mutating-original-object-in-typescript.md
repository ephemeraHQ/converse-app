## SpecStory

## Mutating Original Object in TypeScript (12/18/2024, 10:45:32 AM)

_**User**_

I don't want. to spread, i need to mutate the original object

---

_**Assistant**_

I'll modify the function to mutate the original object instead of creating a new one. Here's the updated version:

```typescript:utils/update-object-properties.ts
type NestedObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is NestedObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function updateObjectProperties<T extends NestedObject>(
  object: T,
  properties: Partial<T>
): T {
  // ... existing code ...
  for (const [key, newValue] of Object.entries(properties) as [keyof T, T[keyof T]][]) {
    if (isPlainObject(newValue)) {
      const existingValue = object[key];
      if (isPlainObject(existingValue)) {
        updateObjectProperties(
          existingValue as T[keyof T],
          newValue as Partial<T[keyof T]>
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
1. Removed the `updatedObject` spread and now working directly with the input `object`
2. Removed the spread when assigning new object values
3. For nested objects, we're now directly mutating the original object's properties

This version will modify the original object instead of creating a new copy. The function still returns the object for chaining purposes, but the original object passed in will be modified.

---

_**User**_

For the code present, we get this error:
```
Argument of type 'T[keyof T]' is not assignable to parameter of type 'NestedObject'.
  Type 'T[string] | T[number] | T[symbol]' is not assignable to type 'NestedObject'.
    Type 'T[string]' is not assignable to type 'NestedObject'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the fix for the type error. We need to add an additional type assertion since TypeScript can't infer that `existingValue` matches our `NestedObject` constraint:

```typescript:utils/update-object-properties.ts
// ... existing code ...
        updateObjectProperties(
          existingValue as NestedObject,
          newValue as Partial<NestedObject>
        );
// ... existing code ...
```

This works because we've already verified that `existingValue` is a plain object through the `isPlainObject` check, so the type assertion is safe.

---



---

