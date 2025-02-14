## SpecStory

## Code Cleanup and Optimization for React Component (2/5/2025, 9:36:42 AM)

_**User**_

can you make this a little cleaner

---

_**Assistant**_

I'll help clean up this component by making a few key improvements. Here are the main changes I suggest:

1. Group related hooks together
2. Extract some complex logic into separate hooks
3. Simplify some of the memoization logic
4. Improve the organization of the code

Here's the cleaned up version:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-dm.tsx
// ... existing imports ...

export const ConversationListItemDm = memo(function ConversationListItemDm({
  conversationTopic,
}: IConversationListItemDmProps) {
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();

  // Conversation related hooks
  const { data: conversation } = useConversationQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "Conversation List Item Dm",
  });

  const { data: peerInboxId, isLoading: isLoadingPeerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "ConversationListItemDm",
  });

  // Peer info hooks
  const { data: preferredName, isLoading: isLoadingPreferredName } = usePreferredInboxName({
    inboxId: peerInboxId,
  });
  const { data: avatarUri } = usePreferredInboxAvatar({
    inboxId: peerInboxId,
  });

  // Status hooks
  const { isUnread } = useConversationIsUnread({ topic: conversationTopic });
  const { isDeleted } = useConversationIsDeleted({ conversationTopic });
  const messageText = useMessagePlainText(conversation?.lastMessage);

  // Action hooks
  const deleteDm = useDeleteDm({ topic: conversationTopic });
  const { restoreConversationAsync } = useRestoreConversation({ topic: conversationTopic });
  const { toggleReadStatusAsync } = useToggleReadStatus({ topic: conversationTopic });

  // Computed values
  const title = useMemo(() => {
    if (preferredName) return preferredName;
    return isLoadingPreferredName || isLoadingPeerInboxId ? " " : " ";
  }, [preferredName, isLoadingPreferredName, isLoadingPeerInboxId]);

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getCompactRelativeTime(timestamp);
  
  const subtitle = useMemo(() => {
    if (!timeToShow || !messageText) return "";
    return `${timeToShow} ${MIDDLE_DOT} ${messageText}`;
  }, [timeToShow, messageText]);

  const avatarComponent = useMemo(() => (
    <Avatar size={theme.avatarSize.lg} uri={avatarUri} name={preferredName} />
  ), [avatarUri, preferredName, theme]);

  const leftActionsBackgroundColor = useMemo(() => 
    isDeleted ? theme.colors.fill.tertiary : theme.colors.fill.caution
  , [isDeleted, theme]);

  // Handlers
  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversationTopic });
  }, [conversationTopic]);

  const onLeftSwipe = useCallback(async () => {
    try {
      await (isDeleted ? restoreConversationAsync() : deleteDm());
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [isDeleted, deleteDm, restoreConversationAsync]);

  const onRightSwipe = useCallback(async () => {
    try {
      await toggleReadStatusAsync();
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [toggleReadStatusAsync]);

  // Swipe action renderers
  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => (
    isDeleted ? <RestoreSwipeableAction {...args} /> : <DeleteSwipeableAction {...args} />
  ), [isDeleted]);

  const renderRightActions = useCallback((args: ISwipeableRenderActionsArgs) => (
    <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
  ), [conversationTopic]);

  return (
    <ConversationListItemSwipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={onLeftSwipe}
      onRightSwipe={onRightSwipe}
      leftActionsBackgroundColor={leftActionsBackgroundColor}
    >
      <ConversationListItem
        onPress={onPress}
        showError={false}
        avatarComponent={avatarComponent}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  );
});
```

Key improvements made:

1. Grouped related hooks together (conversation, peer info, status, and action hooks)
2. Simplified some of the memoization logic (e.g., for leftActionsBackgroundColor)
3. Simplified the onLeftSwipe handler using a ternary
4. Added clear section comments to improve code readability
5. Removed unnecessary non-null assertions where possible
6. Simplified some of the return statements in the memoized functions

The component's functionality remains the same, but the code is now better organized and easier to understand. The grouping of related hooks and clear sectioning makes it easier to maintain and modify in the future.

---



---

