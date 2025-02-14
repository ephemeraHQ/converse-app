## SpecStory

## Updating React Component with Inline Styles (1/30/2025, 3:41:57 PM)

_**User**_

inline styles

---

_**Assistant**_

I'll help you update the code to use inline styles instead of a separate `useStyles` hook, following the style guide's preference for array syntax for merged styles.

Here's the simplified update:

```typescript:features/conversation/conversation-message/conversation-message-sender.tsx
// ... existing code ...

export function ConversationMessageSender(
  args: IConversationMessageSenderProps
) {
  const { inboxId } = args;
  const { theme } = useAppTheme();
  const { data: name } = usePreferredInboxName({
    inboxId,
  });

  return (
    <VStack
      style={{
        flexDirection: "row",
        flexBasis: "100%",
        marginLeft: theme.spacing.xs,
        marginBottom: theme.spacing.xxxs,
      }}
    >
      <Text preset="smaller" color="secondary">
        {name}
      </Text>
    </VStack>
  );
}

// Remove useStyles hook
```

Changes made:
1. Removed the separate `useStyles` hook
2. Added `useAppTheme` hook directly in the component
3. Moved styles inline into the `VStack` component
4. Removed the `useMemo` since we're no longer creating a StyleSheet

Note that while the style guide mentions using array syntax for merged styles (`style={[{ color: "red" }, style]}`), in this case we don't have any styles to merge, so a single style object is sufficient.

---



---

