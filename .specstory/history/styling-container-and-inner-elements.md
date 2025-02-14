## SpecStory

## Styling Container and Inner Elements (1/17/2025, 9:28:25 AM)

_**User**_

create style for $container and $inner (hstack) I want container to be the absolute with neg left/right but inner to have borderwith, padding, etc..

---

_**Assistant**_

I'll help you split the styles between an outer container and inner content. Here's the updated code:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-message-preview.tsx
// ... existing code ...

export const PinnedConversationMessagePreview = (
  props: IPinnedConversationMessagePreviewProps
) => {
  const { message } = props;

  if (!isTextMessage(message)) {
    throw new Error(
      "Pinned message preview can only be used for text messages"
    );
  }

  const { themed } = useAppTheme();

  const textContent = useMessagePlainText(message);

  return (
    <View style={themed($containerStyle)}>
      <HStack style={themed($innerStyle)}>
        <Center>
          <Text numberOfLines={2} preset="smaller">
            {textContent}
          </Text>
        </Center>
      </HStack>
    </View>
  );
};

const $containerStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: 0,
  left: -spacing.xs,
  right: -spacing.xs,
});

const $innerStyle: ThemedStyle<ViewStyle> = ({
  colors,
  borderRadius,
  borderWidth,
  spacing,
}) => ({
  backgroundColor: colors.background.raised,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  alignSelf: "center",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
});
```

Key changes made:
1. Split the styles into `$containerStyle` and `$innerStyle`
2. Added a `View` component as the outer container
3. Moved positioning styles to the container
4. Moved visual styles (background, border, padding) to the inner HStack
5. Fixed the text content to use the actual `textContent` variable instead of "hey"

Don't forget to import `View` from 'react-native' at the top of the file.

---



---

