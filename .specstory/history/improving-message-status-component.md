## SpecStory

## Improving Message Status Component (12/19/2024, 11:27:21 AM)

_**User**_

I want to improve this and make aadd an entering animation . But only when the statusText is not sending. because we have sending text to " " so that it renders still but i want the animation when the real status text appear with the checkbox for exmaple. Also make this cleaner i feel it's not, maybe separate component for when it's sent? Error ,etc? IDK

---

_**Assistant**_

I'll help you improve this component by adding conditional animations and breaking it down into more focused subcomponents. Here's the refactored version:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
// ... imports remain the same ...

type IStatusIndicatorProps = {
  status: IConversationMessageStatus;
};

const SentIndicator = memo(function SentIndicator() {
  const { theme } = useAppTheme();
  
  return (
    <Center
      style={{
        width: 14,
        height: 14,
        padding: 1,
      }}
    >
      <Icon
        icon="checkmark"
        size={theme.iconSize.xs}
        color={theme.colors.text.secondary}
      />
    </Center>
  );
});

const StatusIndicator = memo(function StatusIndicator({ status }: IStatusIndicatorProps) {
  const { theme } = useAppTheme();
  const statusText = statusMapping[status];
  
  if (status === "sending" || !statusText) {
    return null;
  }

  return (
    <AnimatedHStack
      entering={theme.animation.reanimatedFadeInSpring}
      style={{
        columnGap: theme.spacing.xxxs,
        paddingTop: theme.spacing.xxxs,
      }}
    >
      <AnimatedText color="secondary" size="xxs">
        {statusText}
      </AnimatedText>
      {status === "sent" && <SentIndicator />}
    </AnimatedHStack>
  );
});

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({ status }: IConversationMessageStatusProps) {
    const previousStatus = usePrevious(status);

    useEffect(() => {
      if (previousStatus === "sending" && status === "sent") {
        Haptics.softImpactAsync();
      }
    }, [status, previousStatus]);

    return <StatusIndicator status={status} />;
  }
);
```

Key improvements made:

1. Created a separate `SentIndicator` component for the checkmark icon
2. Created a `StatusIndicator` component that handles the animation and rendering logic
3. Animation will only trigger when status is not "sending" since we now explicitly return null in that case
4. Main component is now cleaner, only handling the haptics effect
5. Removed commented out debugBorder
6. Maintained the same functionality but with better component separation

The animation will now only appear when transitioning to a real status (sent/error) since we're returning null for the "sending" state. This creates a nice effect where the status indicator smoothly appears when the message is actually sent or encounters an error.

If you want to add more status types in the future, you can easily create new indicator components and add them to the `StatusIndicator` component's conditional rendering.

---



---

