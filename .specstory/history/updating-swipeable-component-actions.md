## SpecStory

## Updating Swipeable Component Actions (1/9/2025, 9:58:04 AM)

_**User**_

renderLeftActions andrenderRightACtions have parmas like the progress

---

_**Assistant**_

I'll help you update the `renderLeftActions` and `renderRightActions` functions to include the progress parameter. Here's the relevant change:

```typescript:components/swipeable.tsx
// ... existing code ...

export function Swipeable({
  leftComponent,
  rightComponent,
  onLeftSwipe,
  onRightSwipe,
  onLeftActionPress,
  onWillLeftSwipe,
  onRightActionPress,
  onWillRightSwipe,
  overshootLeft,
  dragOffsetFromLeftEdge,
  children,
}: ISwipeableProps) {
  const renderLeftActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => leftComponent,
    [leftComponent]
  );
  
  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => rightComponent,
    [rightComponent]
  );

  // ... rest of the component code ...
}
```

You'll also need to add the import for `Animated` from react-native at the top of the file:

```typescript:components/swipeable.tsx
import { Animated } from "react-native";
```

The change adds the `progress` parameter to both render functions. This parameter is provided by `react-native-gesture-handler/Swipeable` and can be used to create animations based on the swipe progress. Even though we're not using the progress parameter in this case, it's important to include it to match the expected function signature from the Swipeable component.

---



---

