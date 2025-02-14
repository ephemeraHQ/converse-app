## SpecStory

## ESLint Configuration for Function Return Types (11/6/2024, 11:45:07 AM)

_**User**_

this doesn'T work how can i have eslint rule that will give me an error if the person put explicit time on function

---

_**Assistant**_

I'll help you modify the ESLint rule to catch explicit return type annotations on functions. Here's how you can update the configuration:

```json:.eslintrc.json
// ... existing code ...
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true,
      "allowHigherOrderFunctions": true,
      "allowDirectConstAssertionInArrowFunctions": true,
      "allowConciseArrowFunctionExpressionsStartingWithVoid": true,
      "allowedNames": []
    }],
    "@typescript-eslint/ban-types": [
      "error",
      {
        "types": {
          "Function": {
            "message": "Avoid using the `Function` type. Use specific function types instead."
          }
        },
        "extendDefaults": true
      }
    ],
// ... existing code ...
```

The key changes are:

1. Changed `@typescript-eslint/explicit-function-return-type` from `"off"` to `"error"` with specific configuration
2. Updated the `ban-types` rule message to be more specific about `Function` type usage

This configuration will:
- Error when someone adds explicit return types to functions
- Allow function expressions (like arrow functions) without return types
- Allow higher-order functions without return types
- Still ban the generic `Function` type

For example, this will error:
```typescript
function getData(): string { // ❌ Error
  return "data"
}
```

But allow:
```typescript
function getData() { // ✅ OK
  return "data"
}
```

---



---

