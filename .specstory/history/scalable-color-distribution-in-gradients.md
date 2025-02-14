## SpecStory

## Scalable Color Distribution in Gradients (1/8/2025, 12:22:43 PM)

_**User**_

what if we pass 3 colors and distrubtion 70 for example? or even 4 colors , etc... can i do something scalable?maybe disctibriton isn't good and instead we pass array of numbers example if I pass [0,70], first color start at 0 and second start a 70%? If i don't pass any distrubtuon by default it's [0,50] and maybe we make sure to check the number of colors so that if we have 3 colors it's actaully [0,33,66] for example

---

_**Assistant**_

I'll help you create a more scalable solution for handling multiple colors with custom distributions. Here's the improved version:

```typescript:design-system/linear-gradient.tsx
import {
  LinearGradient as ExpoLinearGradient,
  LinearGradientProps as ExpoLinearGradientProps,
} from "expo-linear-gradient";
import { memo } from "react";

type ILinearGradientProps = Omit<ExpoLinearGradientProps, 'locations'> & {
  isAbsoluteFill?: boolean;
  orientation?: "vertical" | "horizontal";
  locations?: number[]; // Array of percentages (0-100)
};

export const LinearGradient = memo(function LinearGradient(props: ILinearGradientProps) {
  const {
    isAbsoluteFill,
    orientation = "vertical",
    locations: customLocations,
    colors,
    ...rest
  } = props;

  // Generate evenly distributed locations if not provided
  const locations = customLocations ?? generateEvenDistribution(colors?.length ?? 0);

  // Normalize locations from percentages to 0-1 range
  const normalizedLocations = locations.map(l => l / 100);

  const start =
    rest.start ??
    (orientation === "vertical" ? { x: 0, y: 0 } : { x: 0, y: 0 });
  const end =
    rest.end ?? (orientation === "vertical" ? { x: 0, y: 1 } : { x: 1, y: 0 });

  return (
    <ExpoLinearGradient
      {...rest}
      colors={colors}
      locations={normalizedLocations}
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

function generateEvenDistribution(colorCount: number): number[] {
  if (colorCount <= 1) return [0];
  
  return Array.from({ length: colorCount }, (_, index) => 
    Math.round((index / (colorCount - 1)) * 100)
  );
}
```

Key changes made:
1. Removed the `distribution` prop in favor of a more flexible `locations` array
2. Added a helper function `generateEvenDistribution` that creates evenly spaced locations based on the number of colors
3. Locations are now specified in percentages (0-100) and normalized to 0-1 internally
4. The component automatically handles any number of colors

Usage examples:
```typescript
// Two colors with default 0-100 distribution
<LinearGradient colors={["#FF0000", "#0000FF"]} />

// Three colors with even distribution (0, 50, 100)
<LinearGradient colors={["#FF0000", "#00FF00", "#0000FF"]} />

// Custom distribution for three colors
<LinearGradient 
  colors={["#FF0000", "#00FF00", "#0000FF"]}
  locations={[0, 70, 100]}
/>

// Four colors with custom distribution
<LinearGradient 
  colors={["#FF0000", "#00FF00", "#0000FF", "#FF00FF"]}
  locations={[0, 30, 70, 100]}
/>
```

This solution is more flexible and scalable because:
- It handles any number of colors
- Allows custom distribution points for each color
- Automatically generates even distribution if none provided
- Uses a more intuitive percentage-based system (0-100 instead of 0-1)
- Type-safe with TypeScript

---

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 2, '(props: LinearGradientProps): LinearGradient', gave the following error.
    Type '{ colors: readonly [string, string, ...string[]]; start: LinearGradientPoint; end: LinearGradientPoint; style: StyleProp<ViewStyle>[]; ... 87 more ...; locations?: number[] | undefined; }' is not assignable to type 'Readonly<LinearGradientProps>'.
      Types of property 'locations' are incompatible.
        Type 'number[] | undefined' is not assignable to type 'readonly [number, number, ...number[]] | null | undefined'.
          Type 'number[]' is not assignable to type 'readonly [number, number, ...number[]]'.
            Source provides no match for required element at position 0 in target.
  Overload 2 of 2, '(props: LinearGradientProps, context: any): LinearGradient', gave the following error.
    Type '{ colors: readonly [string, string, ...string[]]; start: LinearGradientPoint; end: LinearGradientPoint; style: StyleProp<ViewStyle>[]; ... 87 more ...; locations?: number[] | undefined; }' is not assignable to type 'Readonly<LinearGradientProps>'.
      Types of property 'locations' are incompatible.
        Type 'number[] | undefined' is not assignable to type 'readonly [number, number, ...number[]] | null | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is due to type mismatch - `ExpoLinearGradient` expects `locations` to be a tuple with at least 2 elements. Here's the fix:

```typescript:design-system/linear-gradient.tsx
// ... existing code ...
  const normalizedLocations = locations.map(l => l / 100) as [number, number, ...number[]];

  return (
    <ExpoLinearGradient
      {...rest}
      colors={colors}
      locations={normalizedLocations}
      // ... rest of the props
    />
  );
// ... existing code ...
```

The key change is type asserting the `normalizedLocations` array to match the expected tuple type `[number, number, ...number[]]`. This is safe because we know we'll always have at least 2 colors/locations in practice.

---



---

