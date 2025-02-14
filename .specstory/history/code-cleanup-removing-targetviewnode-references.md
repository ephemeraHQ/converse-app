## SpecStory

## Code Cleanup: Removing targetViewNode References (1/17/2025, 7:13:51 AM)

_**User**_

remove stuff about targeViewNode etc

---

_**Assistant**_

I'll help remove the targetViewNode-related code and clean up the component. Here are the necessary edits:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation.tsx
// ... existing code ...

export const ConversationListPinnedConversation: FC<
  IConversationListPinnedConversationProps
> = ({ avatarComponent, onPress, showUnread, title, contextMenuProps }) => {
  const { themed, theme } = useAppTheme();
  const contextMenuRef = useRef<ContextMenuView>(null);

  const gesture = Gesture.Race(
    Gesture.LongPress()
      .minDuration(500)
      .onStart(() => {
        contextMenuRef.current?.presentMenu();
      }),
    Gesture.Tap().onEnd(() => {
      runOnJS(onPress)();
    })
  );

  return (
    <AnimatedVStack style={themed($container)}>
      <ContextMenuView
        ref={contextMenuRef}
        hitSlop={theme.spacing.xs}
        {...contextMenuProps}
        style={[
          {
            borderRadius: 999,
          },
          contextMenuProps.style,
        ]}
        onMenuWillShow={() => {
          console.log("show");
        }}
      >
        <Pressable
          onPress={() => {
            setTimeout(() => {
              console.log("go");
              // onPress();
            }, 100);
          }}
          delayLongPress={100}
        >
          <Center
            style={{
              borderRadius: 999,
            }}
          >
            {avatarComponent}
          </Center>
        </Pressable>
      </ContextMenuView>
      // ... existing code ...
```

Changes made:
1. Removed the `targetViewNode` state and its setter
2. Removed the `useEffect` cleanup for `targetViewNode`
3. Removed the `onLayout` prop and its related logic from the `Center` component
4. Removed the `View` type from imports (if it was there)

The code is now cleaner and focused on its core functionality without the unused target view node tracking.

---



---

