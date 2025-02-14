## SpecStory

## Utilizing All Component Props (1/9/2025, 9:52:12 AM)

_**User**_

make sure all props are used

---

_**Assistant**_

I notice that `onLeftActionPress` is defined in the props but never used. Let's add it to the left action button's `onPress` handler, similar to how `onRightActionPress` is used.

Here's the necessary edit:

```typescript:components/swipeable.tsx
// ... existing code ...

  const renderLeftActions = useCallback(() => {
    return (
      <RectButton style={themed($leftAction)} onPress={onLeftActionPress}>
        <Icon
          icon={leftActionIcon}
          color={themedInversePrimaryColor}
          size={iconSize.lg}
        />
      </RectButton>
    );
  }, [leftActionIcon, themed, themedInversePrimaryColor, iconSize.lg, onLeftActionPress]);

// ... existing code ...
```

Changes made:
1. Added `onPress={onLeftActionPress}` to the left `RectButton`
2. Added `onLeftActionPress` to the dependency array of `useCallback`

Now all props defined in `ISwipeableProps` are being utilized in the component.

---



---

