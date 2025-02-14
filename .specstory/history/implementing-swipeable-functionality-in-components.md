## SpecStory

## Implementing Swipeable Functionality in Components (1/9/2025, 3:41:25 PM)

_**User**_

Check what's been done in for the Swipeable and do the same

---

_**Assistant**_

Looking at the V3DMListItem implementation, I'll help add the Swipeable functionality to the V3GroupConversationListItem component with similar swipe actions. Here are the necessary changes:

```typescript:features/conversation-list/components/conversation-list-item/V3GroupConversationListItem.tsx
// ... existing imports ...
import { ISwipeableRenderActionsArgs, Swipeable } from "@/components/swipeable";
import { ConversationListItemSwipeableAction } from "@/features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable";
import { useConversationIsUnreadByTopic } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { memo, useCallback, useMemo } from "react";

export function V3GroupConversationListItem({
  group,
}: V3GroupConversationListItemProps) {
  // ... existing code ...

  const toggleReadStatus = useToggleReadStatus({
    topic,
  });

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    return <LeftSwipeableActions {...args} />;
  }, []);

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return <RightSwipeableActions {...args} topic={topic} />;
    },
    [topic]
  );

  return (
    <Swipeable
      closeOnOpen
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      leftThreshold={theme.spacing["5xl"]}
      leftActionsBackgroundColor={theme.colors.fill.caution}
      rightActionsBackgroundColor={theme.colors.fill.minimal}
      onLeftSwipe={() => {/* TODO: Implement group deletion */}}
      onRightSwipe={toggleReadStatus}
    >
      <ConversationListItem
        onPress={onPress}
        showError={false}
        avatarComponent={avatarComponent}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </Swipeable>
  );
}

const RightSwipeableActions = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { theme } = useAppTheme();

    const isUnread = useConversationIsUnreadByTopic({
      topic: props.topic,
    });

    return (
      <ConversationListItemSwipeableAction
        icon={isUnread ? "checkmark" : "message.badge"}
        color={theme.colors.fill.minimal}
        actionProgress={props.progressAnimatedValue}
      />
    );
  }
);

const LeftSwipeableActions = memo((props: ISwipeableRenderActionsArgs) => {
  const { theme } = useAppTheme();

  return (
    <ConversationListItemSwipeableAction
      icon="trash"
      color={theme.colors.fill.caution}
      actionProgress={props.progressAnimatedValue}
      iconColor={theme.colors.fill.inverted.primary}
    />
  );
});
```

The changes add swipeable functionality similar to V3DMListItem:
1. Added imports for Swipeable components and related hooks
2. Added swipe action components (LeftSwipeableActions and RightSwipeableActions)
3. Wrapped ConversationListItem in Swipeable component with similar configuration
4. Added toggleReadStatus functionality for right swipe
5. Left a TODO for group deletion implementation since it might require different logic than DM deletion

Note that the group deletion functionality (onLeftSwipe) is currently empty and would need to be implemented based on your group conversation requirements.

---



---

