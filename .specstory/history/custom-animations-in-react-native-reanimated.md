## SpecStory

## Custom Animations in React Native Reanimated (12/4/2024, 3:40:56 PM)

_**User**_

can i not use 

export declare class FadeIn extends ComplexAnimationBuilder implements IEntryExitAnimationBuilder {
    static presetName: string;
    static createInstance<T extends typeof BaseAnimationBuilder>(this: T): InstanceType<T>;
    build: () => EntryExitAnimationFunction;
}

? check in -react-native-reanimated

---

_**Assistant**_

In `react-native-reanimated`, you can avoid using classes like `FadeIn` by using functional and declarative patterns. Instead of using `FadeIn`, you can create a custom animation using hooks and functions. Here's how you can modify your existing code to use a custom animation without relying on the `FadeIn` class:

```typescript:components/Chat/Message/message-context-menu/message-context-menu-items.tsx
import { withSpring } from "react-native-reanimated";
// ... existing imports ...

export const MessageContextMenuItems = memo(
  function MessageContextMenuItems(props: { items: TableViewItemType[] }) {
    const { theme } = useAppTheme();
    const { items } = props;

    const customEnteringAnimation = useCallback(
      (targetValues: EntryAnimationsValues) => {
        "worklet";
        const animations = {
          originX: withSpring(
            targetValues.targetOriginX,
            theme.animation.contextMenuSpring
          ),
          originY: withSpring(
            targetValues.targetOriginY,
            theme.animation.contextMenuSpring
          ),
          opacity: withSpring(1, theme.animation.contextMenuSpring),
          transform: [
            { scale: withSpring(1, theme.animation.contextMenuSpring) },
          ],
        };

        const initialValues = {
          originX: MENU_ITEMS_WIDTH,
          originY: 0,
          opacity: 0,
          transform: [{ scale: 0 }],
        };

        return {
          initialValues,
          animations,
        };
      },
      [theme.animation.contextMenuSpring]
    );

    return (
      <AnimatedVStack entering={customEnteringAnimation}>
        <TableView
          items={items}
          style={{
            width: MENU_ITEMS_WIDTH,
            backgroundColor:
              Platform.OS === "android"
                ? theme.colors.background.raised
                : undefined,
            borderRadius: Platform.OS === "android" ? 10 : undefined,
          }}
        />
      </AnimatedVStack>
    );
  }
);
```

### Explanation:
- **Custom Animation**: Instead of using `FadeIn`, a custom animation is defined using `withSpring` to animate properties like `originX`, `originY`, `opacity`, and `transform`.
- **Functional Approach**: The animation logic is encapsulated in a `useCallback` hook, which is a functional approach, avoiding the use of classes.
- **Memoization**: The component is wrapped in `memo` to optimize rendering.

This approach aligns with your preference for functional and declarative programming patterns.

---



---

