## SpecStory

## Dynamic Action Sheet Menu Configuration (2/3/2025, 1:36:03 PM)

_**User**_

i want the actionSheet options to map the @context-menu.types.ts menu actions optoons

---

_**Assistant**_

I'll help you modify the `ContextMenuAlert` component to use the menu actions from the props instead of hardcoded values. Here's the updated code:

```typescript:design-system/context-menu/context-menu.ios.tsx
// ... existing code ...

const ContextMenuAlert = memo(function ContextMenuAlert(
  props: IContextMenuViewProps
) {
  const { menuConfig, onPressMenuItem, children, style } = props;

  const scaleAV = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAV.value }],
  }));

  const showActionSheet = useCallback(() => {
    // Transform menuConfig.menuItems into action sheet options
    const options = [...menuConfig.menuItems.map(item => item.actionTitle), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = menuConfig.menuItems.findIndex(
      item => item.menuAttributes?.includes('destructive')
    );

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
      },
      (selectedIndex) => {
        if (selectedIndex !== undefined && selectedIndex !== cancelButtonIndex) {
          onPressMenuItem?.({
            nativeEvent: { actionKey: menuConfig.menuItems[selectedIndex].actionKey }
          });
        }
      }
    );
  }, [menuConfig, onPressMenuItem]);

  // ... rest of the component remains the same ...
});
```

Key changes made:
1. Created options array from `menuConfig.menuItems` and added 'Cancel' at the end
2. Set `cancelButtonIndex` to the last index (Cancel option)
3. Found destructive button index by checking `menuAttributes`
4. Added callback to handle option selection and trigger `onPressMenuItem` with the correct `actionKey`

The action sheet will now display the menu items from the provided `menuConfig` and handle the selection appropriately.

---



---

