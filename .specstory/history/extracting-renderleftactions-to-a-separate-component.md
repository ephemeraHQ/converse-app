## SpecStory

## Extracting renderLeftActions to a Separate Component (1/9/2025, 11:03:43 AM)

_**User**_

renderleftactions in a separte otusdie component

---

_**Assistant**_

I'll help you extract the `renderLeftActions` into a separate component within the same file, following the style guide. Here's how to modify the code:

```typescript:features/conversation/conversation-message/conversation-message-repliable.tsx
// ... existing imports ...

type IProps = {
  children: React.ReactNode;
  onReply: () => void;
};

type ISwipeActionProps = {
  progressAV: SharedValue<number>;
};

const SwipeReplyAction = memo(function SwipeReplyAction({ progressAV }: ISwipeActionProps) {
  const { theme } = useAppTheme();

  return (
    <AnimatedVStack
      {...debugBorder()}
      style={{
        height: "100%",
        justifyContent: "center",
        paddingLeft: theme.spacing.sm,
        opacity: interpolate(progressAV.value, [0, SWIPE_REPLY_THRESHOLD], [0, 1]),
        transform: [
          {
            scale: interpolate(progressAV.value, [0, SWIPE_REPLY_THRESHOLD], [0, 1], {
              extrapolate: "clamp",
            }),
          },
          {
            translateX: interpolate(progressAV.value, [0, SWIPE_REPLY_THRESHOLD], [0, 0], {
              extrapolate: "clamp",
            }),
          },
        ],
      }}
    >
      <Icon size={theme.iconSize.sm} icon="arrowshape.turn.up.left.fill" />
    </AnimatedVStack>
  );
});

export const ConversationMessageRepliable = memo(
  function ConversationMessageRepliable({ children, onReply }: IProps) {
    const { theme } = useAppTheme();
    const dragOffsetFromLeftEdge = theme.spacing.xs;

    return (
      <Swipeable
        dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
        onWillLeftSwipe={() => {
          Haptics.successNotificationAsync();
          onReply();
        }}
        renderLeftActions={(progressAV) => <SwipeReplyAction progressAV={progressAV} />}
      >
        {children}
      </Swipeable>
    );
  }
);
```

I've extracted the `renderLeftActions` function into a separate memoized component called `SwipeReplyAction`. The changes include:

1. Created a new type `ISwipeActionProps` for the extracted component
2. Created the `SwipeReplyAction` component that handles the animation and rendering of the reply icon
3. Updated the `renderLeftActions` prop to use the new component
4. Kept both components in the same file as per the style guide

The functionality remains the same, but the code is now more modular and follows the component extraction pattern.

---



---

