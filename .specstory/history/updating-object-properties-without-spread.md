## SpecStory

## Updating Object Properties Without Spread (12/18/2024, 10:43:10 AM)

_**User**_

I want something that will not use spread.. but instead set. the new value, and the properties we can pass are like { user: { test }, name:"123"} etc...

---

_**Assistant**_

I'll help you create a function that recursively updates nested object properties without using spread operators. Here's the updated version:

```typescript:utils/update-object-properties.ts
type INestedObject = { [key: string]: any }

export function updateObjectProperties<T extends INestedObject>(
  object: T,
  properties: Partial<T>
): T {
  const updatedObject = { ...object } // Initial shallow copy to avoid mutating original

  for (const key in properties) {
    const newValue = properties[key]
    
    // Handle nested objects recursively
    if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
      updatedObject[key] = updateObjectProperties(
        object[key] || {},
        newValue
      )
    } else {
      updatedObject[key] = newValue
    }
  }

  return updatedObject
}
```

This updated version:
- Handles nested object updates recursively
- Sets values directly instead of using spread operators for merging
- Preserves TypeScript typing
- Supports deep updates like `{ user: { name: 'John' }, age: 25 }`

Example usage:
```typescript
const user = {
  name: 'John',
  details: {
    age: 25,
    address: {
      city: 'NY'
    }
  }
}

const updated = updateObjectProperties(user, {
  details: {
    age: 26,
    address: {
      city: 'LA'
    }
  }
})
```

Note: I kept one spread operator for the initial shallow copy to avoid mutating the original object. If you want to mutate the original object directly, we can modify the function further.

---

_**User**_

For the code present, we get this error:
```
Type '{}' is not assignable to type 'T[Extract<keyof T, string>]'.
  '{}' is assignable to the constraint of type 'T[Extract<keyof T, string>]', but 'T[Extract<keyof T, string>]' could be instantiated with a different subtype of constraint 'any'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because TypeScript can't guarantee type safety with the empty object fallback. Here's the fix:

```typescript:utils/update-object-properties.ts
// ... existing code ...
    if (newValue && typeof newValue === "object" && !Array.isArray(newValue)) {
      updatedObject[key] = updateObjectProperties(
        (object[key] as INestedObject) || {} as T[typeof key],
        newValue
      );
    } else {
// ... existing code ...
```

This fix adds type assertions to help TypeScript understand that the empty object fallback is safe to use as the expected type. The `as INestedObject` ensures the object is treated as a nested object, while `as T[typeof key]` ensures it matches the expected type for that specific key.

---

_**User**_

For the code present, we get this error:
```
Type 'INestedObject' is not assignable to type 'T[Extract<keyof T, string>]'.
  'INestedObject' is assignable to the constraint of type 'T[Extract<keyof T, string>]', but 'T[Extract<keyof T, string>]' could be instantiated with a different subtype of constraint 'any'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



Here's the fix for the type error:

```typescript:utils/update-object-properties.ts
// ... existing code ...
    if (newValue && typeof newValue === "object" && !Array.isArray(newValue)) {
      updatedObject[key] = updateObjectProperties(
        object[key] || ({} as T[typeof key]),
        newValue as T[typeof key]
      );
    } else {
// ... existing code ...
```

I removed the `INestedObject` assertion and added a type assertion for `newValue`. This ensures both arguments match the expected types for the recursive call.

---



---

