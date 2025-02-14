## SpecStory

## Animating Height in React Native Component (11/20/2024, 12:58:58 PM)

_**User**_

the way i'm trying to animathe the height doesn't work...

---

_**Assistant**_

To animate the height of a component in React Native using `react-native-reanimated`, you need to ensure that the animated value is correctly updated and that the animation is triggered when the component's state changes. Here's a refined approach to animating the height of the `ReplyPreview` component:

1. **Ensure the `contentHeightAV` is updated correctly**: The `onLayout` callback should be used to set the height of the content when it is first rendered.

2. **Trigger the animation**: Use the `useEffect` hook to trigger the animation when `replyingToMessageId` changes.

Here's how you can modify your component:

```typescript:components/Chat/Input/InputDumb.tsx
const ReplyPreview = memo(function ReplyPreview() {
  const { theme } = useAppTheme();

  const replyingToMessageId = useReplyToMessageId();
  const currentAccount = useCurrentAccount() as string;
  const topic = useConversationCurrentTopic();

  const replyMessage = replyingToMessageId
    ? getConversationMessages(currentAccount, topic)?.byId[replyingToMessageId]
    : undefined;

  const readableProfile = replyMessage
    ? getReadableProfile(currentAccount, replyMessage?.senderAddress)
    : null;

  const handleDismiss = useCallback(() => {
    setCurrentConversationReplyToMessageId(null);
  }, []);

  const replyingTo = replyMessage
    ? readableProfile
      ? `${readableProfile} replied to your message`
      : "Replying to message"
    : "";

  const message = useMessageText(replyMessage);

  const contentHeightAV = useSharedValue(0);

  const containerAS = useAnimatedStyle(() => {
    return {
      height: withSpring(contentHeightAV.value, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      }),
    };
  });

  useEffect(() => {
    if (replyingToMessageId) {
      // Trigger the animation when replyingToMessageId changes
      contentHeightAV.value = withSpring(contentHeightAV.value, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      });
    } else {
      contentHeightAV.value = 0;
    }
  }, [replyingToMessageId]);

  return (
    <AnimatedVStack
      style={[
        {
          overflow: "hidden",
        },
        containerAS,
      ]}
    >
      <VStack
        onLayout={(event) => {
          contentHeightAV.value = event.nativeEvent.layout.height;
        }}
        style={{
          paddingHorizontal: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.xxxs,
          backgroundColor: theme.colors.background.surface,
        }}
      >
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxxs,
          }}
        >
          <VStack
            style={{
              rowGap: theme.spacing.xxxs,
              flex: 1,
            }}
          >
            <Text preset="smaller" color="secondary">
              {replyingTo}
            </Text>
            <Text numberOfLines={1}>
              {message}
            </Text>
          </VStack>
          <IconButton
            iconName="xmark"
            onPress={handleDismiss}
            hitSlop={8}
            size="sm"
          />
        </HStack>
      </VStack>
    </AnimatedVStack>
  );
});
```

### Key Changes:
- **`useEffect` Hook**: Added to trigger the animation when `replyingToMessageId` changes.
- **`onLayout` Callback**: Used to set the initial height of the content.
- **`useAnimatedStyle`**: Simplified to directly use `contentHeightAV.value`.

This setup should ensure that the height animation works as expected when the `replyingToMessageId` changes.

---



---

