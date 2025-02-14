## SpecStory

## Fixing TypeScript Overload Error in LinearGradient (1/29/2025, 5:08:47 PM)

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 2, '(props: LinearGradientProps): LinearGradient', gave the following error.
    Type 'string[] | readonly [string, string, ...string[]]' is not assignable to type 'readonly [string, string, ...string[]]'.
      Type 'string[]' is not assignable to type 'readonly [string, string, ...string[]]'.
        Source provides no match for required element at position 0 in target.
  Overload 2 of 2, '(props: LinearGradientProps, context: any): LinearGradient', gave the following error.
    Type 'string[] | readonly [string, string, ...string[]]' is not assignable to type 'readonly [string, string, ...string[]]'.
      Type 'string[]' is not assignable to type 'readonly [string, string, ...string[]]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `ExpoLinearGradient` expects `colors` to be a readonly tuple with at least 2 elements, but we're potentially passing a regular string array. Here's the fix:

```typescript:design-system/linear-gradient.tsx
// ... existing code ...
type ILinearGradientProps = Omit<ExpoLinearGradientProps, 'colors'> & {
  isAbsoluteFill?: boolean;
  orientation?: "vertical" | "horizontal";
  debug?: boolean;
  colors: string[];
};
// ... existing code ...
```

This change:
1. Omits the `colors` prop from `ExpoLinearGradientProps`
2. Redefines it in our interface to accept a regular string array
3. TypeScript will automatically handle the conversion when passing to the underlying component

The rest of the code can remain unchanged.

---



---

