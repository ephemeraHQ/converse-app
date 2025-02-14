## SpecStory

## Conditional Delay Animation for Message Status (1/17/2025, 8:53:25 AM)

_**User**_

possible here to only add the delay if the previous was "sending" ? like if the previous was sent already don't delay or do any animation

---

_**Assistant**_

I'll help modify the code to conditionally apply the delay animation only when transitioning from "sending" to "sent" status. Here's how we can update it:

```typescript:features/conversation/conversation-message/conversation-message-status/conversation-message-status.tsx
// ... existing code ...

const SentStatus = memo(function SentStatus() {
  const { theme } = useAppTheme();
  const previousStatus = usePrevious("sent");

  return (
    <StatusContainer
      // Only apply delay animation when transitioning from sending to sent
      entering={
        previousStatus === "sending"
          ? theme.animation.reanimatedFadeInSpring.delay(300)
          : theme.animation.reanimatedFadeInSpring
      }
    >
      <StatusText text={translate("message_status.sent")} />
      <StatusIconContainer>
        <Icon
          icon="checkmark"
          size={theme.iconSize.xs}
          color={theme.colors.text.secondary}
        />
      </StatusIconContainer>
    </StatusContainer>
  );
});
```

The change adds a `previousStatus` check in the `SentStatus` component. Now the delay animation will only be applied when transitioning from "sending" to "sent". If the message was already in "sent" status (like when scrolling through message history), it will appear immediately without delay.

---

_**User**_

doesn'T make any sense. Look at "ConversationMessageStatus" we render a different component for sent. We need to refactor much more I think

---

_**Assistant**_

Ah yes, you're absolutely right - since we're switching between different components (`SendingStatus` and `SentStatus`), we need to handle this at the parent level. Here's how we can refactor it:

```typescript:features/conversation/conversation-message/conversation-message-status/conversation-message-status.tsx
// ... existing code ...

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const previousStatus = usePrevious(status);
    const { theme } = useAppTheme();

    useEffect(() => {
      // Haptic when message is sent
      if (previousStatus === "sending" && status === "sent") {
        Haptics.softImpactAsync();
      }
    }, [status, previousStatus]);

    if (status === "sending") {
      return <SendingStatus />;
    }

    if (status === "sent") {
      // Pass whether we're transitioning from sending state
      return <SentStatus isTransitioningFromSending={previousStatus === "sending"} />;
    }

    return null;
  }
);

// ... existing code ...

type ISentStatusProps = {
  isTransitioningFromSending: boolean;
};

const SentStatus = memo(function SentStatus({ isTransitioningFromSending }: ISentStatusProps) {
  const { theme } = useAppTheme();

  return (
    <StatusContainer
      entering={
        isTransitioningFromSending
          ? theme.animation.reanimatedFadeInSpring.delay(300)
          : theme.animation.reanimatedFadeInSpring
      }
    >
      <StatusText text={translate("message_status.sent")} />
      <StatusIconContainer>
        <Icon
          icon="checkmark"
          size={theme.iconSize.xs}
          color={theme.colors.text.secondary}
        />
      </StatusIconContainer>
    </StatusContainer>
  );
});
```

Now we:
1. Keep track of the previous status in the parent component
2. Pass a boolean prop `isTransitioningFromSending` to `SentStatus`
3. Only apply the delay animation when we're actually transitioning from the sending state

This way, when viewing existing sent messages or when the status starts as "sent", there won't be any delay in showing the status.

---



---

