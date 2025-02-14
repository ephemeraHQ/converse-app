## SpecStory

## Reusing React Message Component (12/10/2024, 10:03:32 AM)

_**User**_

here the problem i have is i can't do "messageComponent: <Message message={message} />,", I need to do messageComponent: children or something like that, how cna i do it? I want to reuse the component rendered

---

_**Assistant**_

I understand you want to reuse the existing Message component that's already being rendered instead of creating a new instance. Here's how we can modify the code to achieve this:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const DmMessage = memo(function DmMessage() {
  // ... existing imports and other const declarations ...

  const messageComponent = (
    <Message message={message} />
  );

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent,
      });
    },
    [messageStore, message, messageContextMenuStore, messageComponent]
  );

  return (
    <VStack {...debugBorder()}>
      <MessageDateChange />
      <MessageLayout>
        <MessageGestures onLongPress={handleLongPress} onTap={handleTap}>
          {messageComponent}
        </MessageGestures>
      </MessageLayout>
    </VStack>
  );
});
```

The changes:
1. Created a `messageComponent` constant outside the handler that we can reuse
2. Used the same constant both in the `messageContextMenuData` and in the render
3. Added `messageComponent` to the dependency array of `useCallback`

This way, we're reusing the exact same component instance instead of creating a new one in the long press handler.

---

_**User**_

no doens'T work

---

_**Assistant**_

Let me understand better - when you say it doesn't work, is it because the Message component needs to be rendered first before being used in the context menu?

Let's try this approach instead:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const DmMessage = memo(function DmMessage() {
  const message = useMessageContextStoreContext((state) => state.message);
  const messageStore = useMessageContextStore();
  const messageContextMenuStore = useMessageContextMenuStore();

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: e.children, // Use the children from the gesture event
      });
    },
    [messageStore, messageContextMenuStore]
  );

  // ... rest of the code remains the same
});
```

We need to modify the `IMessageGesturesOnLongPressArgs` type to include the children:

```typescript:components/Chat/Message/message-gestures.ts
export type IMessageGesturesOnLongPressArgs = {
  pageX: number;
  pageY: number;
  height: number;
  width: number;
  children: React.ReactNode;
}
```

Then in your MessageGestures component, you'll need to pass the children to the onLongPress callback:

```typescript:components/Chat/Message/message-gestures.tsx
export const MessageGestures = ({ children, onLongPress, onTap }: IMessageGesturesProps) => {
  const handleLongPress = (e: GestureEvent) => {
    onLongPress?.({
      pageX: e.pageX,
      pageY: e.pageY,
      height: e.height,
      width: e.width,
      children // Pass the children here
    });
  };
  
  // ... rest of the component
};
```

This way, we're passing the actual rendered children through the gesture event, which should give you access to the already rendered component.

---

_**User**_

{"$$typeof": "Symbol(react.element)", "_owner": {}, "_store": {}, "key": null, "props": {"message": {}}, "ref": null, "type": {"$$typeof": "Symbol(react.memo)", "compare": null, "type": [Function Message]}}

---

_**Assistant**_



Ah, I see the issue now. You're getting the React element object. Since we want to reuse the exact same rendered component, we should use `e.children` directly. Here's the fix:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const DmMessage = memo(function DmMessage() {
  const message = useMessageContextStoreContext((state) => state.message);
  const messageStore = useMessageContextStore();
  const messageContextMenuStore = useMessageContextMenuStore();

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: e.children,  // This is already the rendered Message component
      });
    },
    [messageStore, messageContextMenuStore]
  );

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime;
    messageStore.setState({
      isShowingTime,
    });
  }, [messageStore]);

  return (
    <VStack {...debugBorder()}>
      <MessageDateChange />
      <MessageLayout>
        <MessageGestures onLongPress={handleLongPress} onTap={handleTap}>
          <Message message={message} />
        </MessageGestures>
      </MessageLayout>
    </VStack>
  );
});
```

The key here is that `e.children` from the gesture event will give us the actual rendered component, not just the React element object. This should work as long as the MessageGestures component is properly passing down its children through the onLongPress event.

Make sure your MessageGestures component is passing the children correctly in the onLongPress callback:

```typescript:components/Chat/Message/message-gestures.tsx
export const MessageGestures = ({ children, onLongPress, onTap }: IMessageGesturesProps) => {
  const handleLongPress = (e: GestureEvent) => {
    onLongPress?.({
      pageX: e.pageX,
      pageY: e.pageY,
      height: e.height,
      width: e.width,
      children // This should be the rendered Message component
    });
  };
  
  // ... rest of the component
};
```

---

_**User**_

this is what I'm doing no? 
import { AnimatedHStack } from "@/design-system/HStack";
import { Haptics } from "@/utils/haptics";
import { memo } from "react";
import { View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  Easing,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Super fast because it's better UX to have a quick response
// Also, we can't use onBegin to start the scaling as soon as the gesture starts because we also have a tap handler
// So for example if we had onBegin, and the user just tapped, it would still start the scaling animation which is weird
const MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION = 300;

const MESSAGE_GESTURE_LONG_PRESS_SCALE = 1.025;

type IContainerMeasure = {
  width: number;
  height: number;
  pageX: number;
  pageY: number;
};

export type IMessageGesturesOnLongPressArgs =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload> &
    IContainerMeasure & {
      children: React.ReactNode;
    };

export type IMessageGesturesProps = {
  children: React.ReactNode;
  onTap?: () => void;
  //   onDoubleTap?: () => void;
  onLongPress?: (e: IMessageGesturesOnLongPressArgs) => void;
};

export const MessageGestures = memo(function MessageGestures(
  args: IMessageGesturesProps
) {
  const {
    children,
    onTap,
    //    onDoubleTap,
    onLongPress,
  } = args;

  const containerRef = useAnimatedRef<View>();

  const scaleAV = useSharedValue(1);

  const tap = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        onTap();
      }
    })
    .runOnJS(true);

  //   const doubleTap = Gesture.Tap()
  //     .numberOfTaps(2)
  //     .onEnd(() => {
  //       if (onDoubleTap) {
  //         onDoubleTap();
  //       }
  //     })
  //     .runOnJS(true);

  const longPress = Gesture.LongPress()
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      scaleAV.value = withTiming(MESSAGE_GESTURE_LONG_PRESS_SCALE, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
      const measured = measure(containerRef);
      if (!measured) return;
      if (onLongPress) {
        runOnJS(onLongPress)({ children, ...e, ...measured });
      }
    })
    .onFinalize(() => {
      scaleAV.value = withTiming(1, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
    })
    .minDuration(MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION);

  const composed = Gesture.Simultaneous(
    //   doubleTap,
    tap,
    longPress
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAV.value }],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <AnimatedHStack
        // {...debugBorder("orange")}
        ref={containerRef}
        style={animatedStyle}
      >
        {children}
      </AnimatedHStack>
    </GestureDetector>
  );
});


---

_**Assistant**_

Yes, you're passing the children correctly, but I see the issue now. The problem is that when you pass React elements as props or in events, they come through as React element objects (which is what you're seeing with that Symbol and _owner structure).

Let's modify the approach. Instead of trying to pass the rendered component, we can clone the element with any additional props we need:

```typescript:components/Chat/Message/message-gestures.tsx
// ... imports remain the same ...

export type IMessageGesturesOnLongPressArgs = Omit<
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload>,
  "children"
> &
  IContainerMeasure & {
    renderMessage: () => React.ReactNode; // Changed from children to renderMessage
  };

export const MessageGestures = memo(function MessageGestures(
  args: IMessageGesturesProps
) {
  const { children, onTap, onLongPress } = args;

  const longPress = Gesture.LongPress()
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      scaleAV.value = withTiming(MESSAGE_GESTURE_LONG_PRESS_SCALE, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
      const measured = measure(containerRef);
      if (!measured) return;
      if (onLongPress) {
        runOnJS(onLongPress)({
          ...e,
          ...measured,
          renderMessage: () => children, // Pass a function that returns children
        });
      }
    })
    // ... rest of the component remains the same
});
```

Then in your DmMessage component:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const DmMessage = memo(function DmMessage() {
  // ... other code remains the same ...

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: e.renderMessage(), // Use the render function
      });
    },
    [messageStore, messageContextMenuStore]
  );

  // ... rest of the component remains the same ...
});
```

This approach:
1. Instead of trying to pass the React element directly, we pass a function that can render it
2. The function maintains the proper context and props
3. When you need to render the message in the context menu, you can call the render function

This should solve the issue with the React element serialization while still allowing you to reuse the same component configuration.

---

_**User**_

possible to create a copy of the children or something?

---

_**Assistant**_



Yes! We can use React.cloneElement to create a copy of the children. Here's how to modify the code:

```typescript:components/Chat/Message/message-gestures.tsx
import React from 'react';
// ... other imports ...

export type IMessageGesturesOnLongPressArgs =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload> &
  IContainerMeasure;

export const MessageGestures = memo(function MessageGestures(
  args: IMessageGesturesProps
) {
  const { children, onTap, onLongPress } = args;

  const containerRef = useAnimatedRef<View>();
  const scaleAV = useSharedValue(1);

  const longPress = Gesture.LongPress()
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      scaleAV.value = withTiming(MESSAGE_GESTURE_LONG_PRESS_SCALE, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
      const measured = measure(containerRef);
      if (!measured) return;
      if (onLongPress) {
        // Clone the children with any additional props if needed
        const clonedChildren = React.cloneElement(children as React.ReactElement, {
          key: 'contextMenu'
        });
        runOnJS(onLongPress)({ ...e, ...measured, clonedElement: clonedChildren });
      }
    })
    // ... rest remains the same
});
```

Then update your types:

```typescript
export type IMessageGesturesOnLongPressArgs =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload> &
  IContainerMeasure & {
    clonedElement: React.ReactElement;
  };
```

And in your DmMessage component:

```typescript
const handleLongPress = useCallback(
  (e: IMessageGesturesOnLongPressArgs) => {
    const messageId = messageStore.getState().messageId;
    messageContextMenuStore.getState().setMessageContextMenuData({
      messageId,
      itemRectX: e.pageX,
      itemRectY: e.pageY,
      itemRectHeight: e.height,
      itemRectWidth: e.width,
      messageComponent: e.clonedElement,
    });
  },
  [messageStore, messageContextMenuStore]
);
```

This will create a new instance of the component while maintaining all the props and configuration. The key prop ensures React treats it as a distinct element in the context menu.

---

_**User**_

no like here:

const WithGestures = memo(function WithGestures({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageStore = useMessageContextStore();

  const messageContextMenuStore = useMessageContextMenuStore();

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: children,
      });
    },
    [messageStore, messageContextMenuStore, children]
  );

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime;
    messageStore.setState({
      isShowingTime,
    });
  }, [messageStore]);

  return (
    <MessageGestures onLongPress={handleLongPress} onTap={handleTap}>
      {children}
    </MessageGestures>
  );
});

---

_**Assistant**_



Ah yes! Here's how to clone the children in the WithGestures component:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const WithGestures = memo(function WithGestures({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageStore = useMessageContextStore();
  const messageContextMenuStore = useMessageContextMenuStore();

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      const clonedMessage = React.cloneElement(children as React.ReactElement, {
        key: 'contextMenu'
      });
      
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: clonedMessage,
      });
    },
    [messageStore, messageContextMenuStore, children]
  );

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime;
    messageStore.setState({
      isShowingTime,
    });
  }, [messageStore]);

  return (
    <MessageGestures onLongPress={handleLongPress} onTap={handleTap}>
      {children}
    </MessageGestures>
  );
});
```

The key changes are:
1. Using `React.cloneElement` to create a copy of the children
2. Adding a unique key to ensure React treats it as a distinct element
3. Using the cloned element as the messageComponent

This should give you a fresh copy of the Message component while maintaining all its props and configuration.

---

_**User**_

I still have error  Error: Missing MessageContextStore.Provider in the tree

but as you can see i'm wrapping it with "MessageContextStoreProvider" . The children is rendered above in parent but I thought it would be okay and render a copy of the children??

---

_**Assistant**_



Ah, now I understand the issue! The problem is that when we clone the element, it loses its context providers. The MessageContextStore provider is wrapping the original component, but the cloned version is being rendered in a different part of the tree where the provider doesn't exist.

Let's modify the approach to wrap the cloned element with the necessary providers:

```typescript:features/conversation/dm-conversation/dm-conversation-content.tsx
const WithGestures = memo(function WithGestures({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageStore = useMessageContextStore();
  const messageContextMenuStore = useMessageContextMenuStore();
  const message = messageStore.getState().message;
  const previousMessage = messageStore.getState().previousMessage;
  const nextMessage = messageStore.getState().nextMessage;

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId;
      const clonedMessage = (
        <MessageContextStoreProvider
          message={message}
          previousMessage={previousMessage}
          nextMessage={nextMessage}
        >
          {React.cloneElement(children as React.ReactElement, {
            key: 'contextMenu'
          })}
        </MessageContextStoreProvider>
      );
      
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        messageComponent: clonedMessage,
      });
    },
    [messageStore, messageContextMenuStore, children, message, previousMessage, nextMessage]
  );

  // ... rest of the component remains the same
});
```

The key changes:
1. Getting the message data from the store
2. Wrapping the cloned element with MessageContextStoreProvider
3. Passing the necessary props to the provider

This way, when the cloned message is rendered in the context menu, it will have access to all the necessary context.

---



---

