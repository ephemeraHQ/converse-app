## SpecStory

## Improving LinearGradient Color Distribution (1/8/2025, 12:20:55 PM)

_**User**_

how can i do logic so that first color is like 30% and second is 70%. I want to make props easy to understand for other to use

---

_**Assistant**_

I'll help you add a prop to control color distribution in an intuitive way. Here's how we can modify the LinearGradient component:

```typescript:design-system/linear-gradient.tsx
export const LinearGradient = memo(function LinearGradient(
  props: ExpoLinearGradientProps & {
    isAbsoluteFill?: boolean;
    orientation?: "vertical" | "horizontal";
    distribution?: number; // percentage of first color (0-100)
  }
) {
  const { isAbsoluteFill, orientation = "vertical", distribution, ...rest } = props;

  // Calculate locations if distribution is provided
  const locations = distribution !== undefined 
    ? [0, distribution / 100, 1]
    : rest.locations;

  // If distribution is set, ensure colors array has 3 items
  const colors = distribution !== undefined && rest.colors 
    ? [rest.colors[0], rest.colors[0], rest.colors[1]]
    : rest.colors;

  const start =
    rest.start ??
    (orientation === "vertical" ? { x: 0, y: 0 } : { x: 0, y: 0 });
  const end =
    rest.end ?? (orientation === "vertical" ? { x: 0, y: 1 } : { x: 1, y: 0 });

  return (
    <ExpoLinearGradient
      {...rest}
      colors={colors}
      locations={locations}
      start={start}
      end={end}
      style={[
        isAbsoluteFill && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        rest.style,
      ]}
    />
  );
});
```

This update adds a new `distribution` prop that accepts a number between 0-100 representing the percentage of the first color. Here's how it works:

1. Added `distribution?: number` to the props type
2. When `distribution` is provided:
   - Creates a `locations` array with 3 points: [0, distribution/100, 1]
   - Duplicates the first color to create a sharp transition at the distribution point

Now users can use it like this:
```tsx
// 30% first color, 70% second color
<LinearGradient
  colors={["#FF0000", "#0000FF"]}
  distribution={30}
/>
```

This makes it much more intuitive than dealing with `locations` directly, while still maintaining all the original functionality when `distribution` is not provided.

---

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 2 of 2, '(props: LinearGradientProps, context: any): LinearGradient', gave the following error.
    Type 'readonly [string, string, ...string[]] | string[]' is not assignable to type 'readonly [string, string, ...string[]]'.
      Type 'string[]' is not assignable to type 'readonly [string, string, ...string[]]'.
  Overload 2 of 2, '(props: LinearGradientProps, context: any): LinearGradient', gave the following error.
    Type 'number[] | readonly [number, number, ...number[]] | null | undefined' is not assignable to type 'readonly [number, number, ...number[]] | null | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is due to TypeScript's strict typing for the `colors` and `locations` props. Here's the fix:

```typescript:design-system/linear-gradient.tsx
// ... existing code ...
      colors={colors as readonly [string, string, ...string[]]}
      locations={locations as readonly [number, number, ...number[]]}
      start={start}
      end={end}
// ... existing code ...
```

This type assertion tells TypeScript that these arrays match the expected readonly tuple type required by ExpoLinearGradient.

---



---

