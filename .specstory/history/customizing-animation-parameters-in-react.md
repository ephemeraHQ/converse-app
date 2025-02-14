## SpecStory

## Customizing Animation Parameters in React (12/4/2024, 3:09:35 PM)

_**User**_

can i pass some values to customEnterinAnimation?

---

_**Assistant**_

To pass values to `customEnteringAnimation`, you can modify the function to accept additional parameters. Then, you can use these parameters within the function to customize the animation. Here's how you can do it:

1. Update the `customEnteringAnimation` function to accept additional arguments.
2. Pass these arguments when you call the function.

Here's an example of how you might modify the code:

```typescript:components/Chat/Message/message-context-menu/message-context-menu-items.tsx
// ... existing imports ...

export const MessageContextMenuItems = memo(
  function MessageContextMenuItems(props: { items: TableViewItemType[], animationConfig?: IAnimationConfig }) {
    const { theme } = useAppTheme();
    const { items, animationConfig } = props;

    return (
      <AnimatedVStack entering={customEnteringAnimation(animationConfig)}>
        <TableView
          items={items}
          style={{
            width: 180,
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

type IAnimationConfig = {
  targetOriginX: number;
  targetOriginY: number;
  opacity: number;
  scale: number;
};

const customEnteringAnimation = (config: IAnimationConfig) => (targetValues) => {
  "worklet";
  const animations = {
    originX: withSpring(config.targetOriginX || targetValues.targetOriginX, SICK_SPRING_CONFIG),
    originY: withSpring(config.targetOriginY || targetValues.targetOriginY, SICK_SPRING_CONFIG),
    opacity: withSpring(config.opacity || 1, SICK_SPRING_CONFIG),
    transform: [{ scale: withSpring(config.scale || 1, SICK_SPRING_CONFIG) }],
  };

  const initialValues = {
    originX: 0,
    originY: 0,
    opacity: 0,
    transform: [{ scale: 0 }],
  };

  return {
    initialValues,
    animations,
  };
};
```

### Explanation:
- **`IAnimationConfig` Type**: This type defines the structure of the configuration object you can pass to customize the animation.
- **`customEnteringAnimation` Function**: Now takes a configuration object and returns a function that uses this configuration to determine the animation values.
- **`MessageContextMenuItems` Component**: Accepts an optional `animationConfig` prop, which is passed to the `customEnteringAnimation` function.

This setup allows you to pass custom animation parameters when using the `MessageContextMenuItems` component.

---



---

