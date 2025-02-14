## SpecStory

## Making DoubleTap and Tap Exclusive (12/4/2024, 11:51:17 AM)

_**User**_

I want doubleTap and tap to be exclusive

---

_**Assistant**_

To make the `doubleTap` and `tap` gestures exclusive, you can use the `Gesture.Exclusive` method. This ensures that only one of the gestures can be recognized at a time. Here's how you can modify the code:

```typescript:components/Chat/Message/message-gestures.tsx
  const composed = Gesture.Exclusive(doubleTap, tap, longPress);
```

### Explanation

- **Gesture.Exclusive**: This method ensures that only one of the gestures in the list can be recognized at a time. If a `doubleTap` is detected, the `tap` will not be recognized, and vice versa.

This change will make sure that a single tap does not interfere with a double tap, and both gestures will be handled separately.

---



---

