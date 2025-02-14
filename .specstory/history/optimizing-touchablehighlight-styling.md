## SpecStory

## Optimizing TouchableHighlight Styling (1/17/2025, 9:15:16 AM)

_**User**_

For touchable highlights we don't need the h-tack on there you can put all the styling into the touchable highlight. 

---

_**Assistant**_

I'll help you simplify the structure by moving the styling from the HStack directly into the TouchableHighlight. Here's how to modify the code:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item.tsx
// ... existing code ...

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
    <TouchableHighlight 
      onPress={onPress} 
      style={[
        themed($touchable),
        themed($conversationListItem),
        { paddingHorizontal: screenHorizontalPadding },
      ]}
    >
      <HStack>
        <Center style={$avatarWrapper}>{avatarComponent}</Center>
        <VStack style={themed($messagePreviewContainer)}>
          <Text preset="bodyBold" weight="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text preset="small" numberOfLines={2} color="secondary">
            {subtitle}
          </Text>
        </VStack>
        {(isUnread || showError) && (
          <AnimatedCenter
            entering={theme.animation.reanimatedFadeInScaleIn()}
            exiting={theme.animation.reanimatedFadeOutScaleOut()}
            style={$unreadContainer}
          >
            <Center
              style={[
                themed($unread),
                (!isUnread || showError) && themed($placeholder),
              ]}
            />
          </AnimatedCenter>
        )}
      </HStack>
    </TouchableHighlight>
  );
});

// ... existing code ...
```

The main changes are:
1. Moved the styling from the HStack to the TouchableHighlight component
2. Combined the styles using an array syntax to include all necessary styles
3. Simplified the HStack by removing its style prop
4. The padding and themed styles are now applied at the TouchableHighlight level

This change makes the component more efficient as the styling is applied at the touchable level, which is more appropriate for touch interactions.

---



---

