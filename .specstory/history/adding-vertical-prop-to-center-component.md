## SpecStory

## Adding Vertical Prop to Center Component (1/31/2025, 9:43:17 AM)

_**User**_

i want to be able to pass a prop like "vertical" that will flexDirection "vertical" because by default we are using hstack 

---

_**Assistant**_

I'll help you modify the Center component to support vertical alignment using a `vertical` prop. We'll need to use `VStack` instead of `HStack` when the vertical prop is true.

```typescript:design-system/Center.tsx
import { ForwardedRef, forwardRef } from "react";
import { View } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

import { HStack, IHStackProps } from "./HStack";
import { VStack } from "./VStack";

// Add vertical prop to the interface
export type ICenterProps = IHStackProps & {
  vertical?: boolean;
};

export const Center = forwardRef(
  (props: ICenterProps, ref: ForwardedRef<View>) => {
    const { style, vertical = false, ...rest } = props;
    
    const Stack = vertical ? VStack : HStack;
    return (
      <Stack
        ref={ref}
        style={[{ alignItems: "center", justifyContent: "center" }, style]}
        {...rest}
      />
    );
  }
);

// ... existing code ...
```

Changes made:
1. Imported `VStack` component
2. Extended `ICenterProps` to include an optional `vertical` prop
3. Destructured `vertical` prop with a default value of `false`
4. Added conditional rendering to use either `VStack` or `HStack` based on the `vertical` prop

Now you can use the Center component with vertical alignment like this:
```typescript
<Center vertical>
  {/* Your content */}
</Center>
```

---



---

