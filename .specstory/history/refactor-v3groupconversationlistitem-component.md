## SpecStory

## Refactor V3GroupConversationListItem Component (1/9/2025, 10:17:06 AM)

_**User**_

remove useData and put stuff in "V3GroupConversationListItem" instead

---

_**Assistant**_

I'll help you remove the `useData` hook and move its logic directly into the `V3GroupConversationListItem` component. Here are the changes:

```typescript:features/conversation-list/components/conversation-list-item/V3GroupConversationListItem.tsx
// ... existing imports ...

export function V3GroupConversationListItem({
  group,
}: V3GroupConversationListItemProps) {
  const { name: routeName } = useRoute();
  const isBlockedChatView = routeName === "Blocked";
  const colorScheme = useColorScheme();
  const { theme } = useAppTheme();
  const currentAccount = useCurrentAccount()!;
  const router = useRouter();

  const topic = group?.topic;
  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: group.lastMessage,
    timestampNs: timestamp,
  });

  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount,
    group
  );

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

  const messageText = useMessageText(group.lastMessage);

  const avatarComponent = useMemo(() => {
    return group?.imageUrlSquare ? (
      <Avatar size={theme.avatarSize.lg} uri={group?.imageUrlSquare} />
    ) : (
      <GroupAvatarDumb size={theme.avatarSize.lg} members={memberData} />
    );
  }, [group?.imageUrlSquare, memberData, theme]);

  // ... rest of the existing component code ...
}
```

Key changes made:
1. Removed the `useData` hook and its type definition
2. Moved all the logic and hooks directly into the main component
3. Kept all the functionality the same, just reorganized where the code lives
4. Maintained the same order of operations as before

The rest of the component (onPress callback, render logic, etc.) remains unchanged.

---



---

