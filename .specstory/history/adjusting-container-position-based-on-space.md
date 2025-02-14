## SpecStory

## Adjusting Container Position Based on Space (12/4/2024, 3:30:37 PM)

_**User**_

fix this what i want here is to maybe apply a transformY to the container if there's not enough space at the bottom or not enough space at the top

---

_**Assistant**_

To adjust the transform logic so that the container is repositioned if there's not enough space at the top or bottom, you can modify the calculation of `transformValue`. Here's how you can update the code:

```typescript:components/Chat/Message/message-context-menu/message-context-menu.tsx
      const screenHeight = theme.layout.screen.height;
      const minTopOffset =
        MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT +
        safeAreaInsets.top;

      const topTransform =
        itemRectY +
        itemRectHeight +
        menuHeight +
        theme.spacing.xs +
        (safeAreaInsets?.bottom || 0);

      const baseTransform = -1 * (itemRectY - theme.spacing.xs - minTopOffset);

      let transformValue = baseTransform;

      if (topTransform > screenHeight) {
        // Not enough space at the bottom
        transformValue = screenHeight - topTransform;
      } else if (itemRectY < minTopOffset) {
        // Not enough space at the top
        transformValue = minTopOffset - itemRectY;
      } else {
        transformValue = 0; // Default position
      }
```

### Explanation:
- **Bottom Space Check**: If `topTransform` exceeds `screenHeight`, it means there's not enough space at the bottom, so we adjust `transformValue` to move the container upwards.
- **Top Space Check**: If `itemRectY` is less than `minTopOffset`, it indicates insufficient space at the top, so we adjust `transformValue` to move the container downwards.
- **Default Position**: If neither condition is met, the container remains in its default position.

---



---

