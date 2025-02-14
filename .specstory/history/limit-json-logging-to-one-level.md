## SpecStory

## Limit JSON Logging to One Level (12/19/2024, 9:34:01 AM)

_**User**_

can we log json but only like 1 level

---

_**Assistant**_

I'll help modify the `logJson` function to only show one level deep of the JSON object. Here's the updated code:

```typescript:utils/logger.ts
// ... existing code ...

export function logJson(json: any) {
  const singleLevelJson = Object.keys(json).reduce((acc, key) => {
    const value = json[key];
    acc[key] = typeof value === 'object' && value !== null 
      ? '[Object]' 
      : value;
    return acc;
  }, {} as Record<string, any>);
  
  console.log(JSON.stringify(singleLevelJson, null, 2));
}

export default logger;
```

This modification:
1. Creates a new object that only goes one level deep
2. Replaces any nested objects with the string `'[Object]'`
3. Keeps primitive values as-is
4. Still formats the output with proper indentation

For example, if you have:
```typescript
logJson({
  name: "John",
  age: 30,
  address: { street: "123 Main St", city: "NYC" },
  hobbies: ["reading", "gaming"]
})
```

It will output:
```json
{
  "name": "John",
  "age": 30,
  "address": "[Object]",
  "hobbies": "[Object]"
}
```

---



---

