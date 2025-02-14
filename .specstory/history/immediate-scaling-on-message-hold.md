## SpecStory

## Immediate Scaling on Message Hold (12/2/2024, 3:21:10 PM)

_**User**_

how can i make sure to start scaling as SOON as the person hold the message? like is there something where I will get a callback called for every time they hold a message

---

_**Assistant**_

To start scaling as soon as the user holds the message, you can use the `onTouchesDown` callback provided by the `Gesture` API. This callback is triggered as soon as the touch is detected, allowing you to start the scaling animation immediately.

Here's how you can modify your `longPressGesture` to use `onTouchesDown`:

```typescript:components/Chat/Message/components/message-layout.tsx
  const longPressGesture = useMemo(() => {
    return Gesture.LongPress()
      .onTouchesDown(() => {
        // Start scaling immediately when the touch is detected
        scale.value = withSpring(1.2, { duration: 210 });
      })
      .onBegin(() => {
        console.log("begin");
      })
      .onStart(() => {
        Haptics.mediumImpactAsync();

        const measured = measure(containerRef);
        if (!measured) return;

        itemRectYAV.value = measured.pageY;
        itemRectXAV.value = measured.pageX;
        itemRectHeightAV.value = measured.height;
        itemRectWidthAV.value = measured.width;
        // opacityAV.value = withDelay(100, withSpring(0));

        runOnJS(dismissKeyboard)();
        // runOnJS(setIsActive)(true);
        console.log("go");
      })
      .onEnd(() => {
        console.log("en");
        scale.value = withSpring(1, {
          duration: 150 / 2, // TODO
        });
      })
      .runOnJS(true);
  }, []);
```

### Explanation:
- **`onTouchesDown`**: This callback is used to start the scaling animation as soon as the touch is detected, providing a more immediate response to the user's action.
- **`scale.value = withSpring(1.2, { duration: 210 });`**: This line initiates the scaling animation to 1.2x size immediately when the touch is detected.

This approach ensures that the scaling effect begins as soon as the user starts holding the message, providing a more responsive user experience.

---



---

