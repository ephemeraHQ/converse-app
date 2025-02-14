## SpecStory

## Refactoring Component Styles in React Native (1/9/2025, 8:32:53 PM)

_**User**_

how can I have this outside of component

---

_**Assistant**_

I'll help you move the `$conversationListItem` style outside the component to match the pattern of the other styles in the file. Here's how to modify the code:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item.tsx
// ... existing imports and type definitions ...

export const ConversationListItem = memo(function ConversationListItem({
  onPress,
  isUnread,
  title,
  subtitle,
  avatarComponent,
  showError,
}: IConversationListItemProps) {
  const { themed, theme } = useAppTheme();
  const { screenHorizontalPadding } = useConversationListStyles();

  return (
    <TouchableHighlight onPress={onPress} style={themed($touchable)}>
      <HStack style={[themed($conversationListItem), { paddingHorizontal: screenHorizontalPadding }]}>
        // ... rest of the JSX ...
      </HStack>
    </TouchableHighlight>
  );
});

// ... other existing styles ...

const $conversationListItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xs,
});

// ... remaining existing styles ...
```

The changes:
1. Moved `$conversationListItem` outside the component as a themed style
2. Changed it to use the `ThemedStyle` type and access spacing from the theme
3. Added the dynamic `paddingHorizontal` directly in the component's JSX using style array syntax
4. Removed the local style definition from inside the component

This follows the project's style guide by:
- Using themed styles consistently
- Keeping styles outside the component
- Using the array syntax for merging styles when we need both themed and dynamic values

---



---

