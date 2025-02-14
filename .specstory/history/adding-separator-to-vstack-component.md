## SpecStory

## Adding Separator to VStack Component (1/31/2025, 9:35:26 AM)

_**User**_

add logic here so that we can pass a separator component that will be renderd between each children but  not first and last one. Really between each 

---

_**Assistant**_

I'll help you add a separator component prop to the VStack component. We'll need to modify the component to handle React children and insert the separator between them.

```typescript:design-system/VStack.tsx
import React, { ForwardedRef, forwardRef, memo, ReactNode } from "react";
import { View, ViewProps } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

export type IVStackProps = ViewProps & {
  separator?: ReactNode;
};

export const VStack = memo(
  forwardRef((props: IVStackProps, ref: ForwardedRef<View>) => {
    const { separator, children, ...restProps } = props;

    const renderChildren = () => {
      const childrenArray = React.Children.toArray(children);
      return childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {separator && index < childrenArray.length - 1 && separator}
        </React.Fragment>
      ));
    };

    return (
      <View
        ref={ref}
        {...restProps}
        style={[
          {
            flexDirection: "column",
          },
          props.style,
        ]}
      >
        {separator ? renderChildren() : children}
      </View>
    );
  })
);

// ... existing code ...
```

Key changes made:
1. Added `separator?: ReactNode` to the `IVStackProps` type
2. Added a `renderChildren` function that:
   - Converts children to array using `React.Children.toArray`
   - Maps through children and adds the separator between them
   - Uses `React.Fragment` to avoid extra wrapper elements
   - Only renders separator if it's not the last child
3. Conditionally renders either the processed children (with separators) or the original children

Now you can use the VStack with a separator like this:
```tsx
<VStack separator={<View style={{ height: 8 }} />}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
  <Text>Item 3</Text>
</VStack>
```

This will render the separator component between each child, but not before the first or after the last child.

---

_**User**_

is this performant enough?

---

_**Assistant**_

Yes, the current implementation is reasonably performant for most use cases. Here's why:

1. The component is already wrapped in `memo()`, which prevents unnecessary re-renders when props haven't changed.

2. `renderChildren()` only runs when there's a separator prop, and it uses `React.Children.toArray()` which is an optimized React method for handling children.

However, if you're dealing with a very large number of children (hundreds) or frequent updates, we could make a few optimizations:

1. We could memoize the `renderChildren` function:

```typescript:design-system/VStack.tsx
// ... existing code ...
    const renderChildren = React.useMemo(() => {
      const childrenArray = React.Children.toArray(children);
      return childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {separator && index < childrenArray.length - 1 && separator}
        </React.Fragment>
      ));
    }, [children, separator]);

    return (
      <View
        ref={ref}
        {...restProps}
        style={[
          {
            flexDirection: "column",
          },
          props.style,
        ]}
      >
        {separator ? renderChildren : children}
      </View>
    );
// ... existing code ...
```

But in practice, this additional optimization would only be noticeable in extreme cases, and it might actually be counterproductive in normal usage because:
1. The memoization itself has a cost
2. Most VStacks will have a small number of children
3. The current implementation is already efficient for typical use cases

Unless you're experiencing actual performance issues with the current implementation, I'd recommend keeping it as is. The current version strikes a good balance between performance and code clarity.

---



---

