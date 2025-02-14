## SpecStory

## Fixing Image Display Issues in Code (1/13/2025, 9:22:08 AM)

_**User**_

I don't understand why the image is cut on the side... 

---

_**Assistant**_

Looking at the code, the issue might be that you're using a fixed width with `aspectRatio: 1` inside a `Center` component. Let's modify the image styling to ensure it's properly centered and not cut off.

Here's how to fix it:

```typescript:features/conversation-list/conversation-list.screen.tsx
const Requests = memo(function Requests() {
  const { theme } = useAppTheme();
  // ... existing code ...

  return (
    <ConversationListItem
      title="Requests"
      onPress={() => {
        navigation.navigate("ChatsRequests");
      }}
      subtitle={`${requestsCount} awaiting your response`}
      avatarComponent={
        <Center
          style={{
            width: theme.avatarSize.lg,
            height: theme.avatarSize.lg,
            backgroundColor: theme.colors.fill.primary,
            borderRadius: 999,
          }}
        >
          <Image
            source={require("@/assets/icons/chat-bubble-dark.png")}
            style={{
              width: theme.avatarSize.sm, // Increased from xs to sm
              height: theme.avatarSize.sm, // Explicitly set height instead of aspectRatio
              resizeMode: 'contain', // Add this to ensure the image scales properly
            }}
          />
        </Center>
      }
    />
  );
});
```

The changes made:
1. Increased the image size from `xs` to `sm` to make it more visible
2. Explicitly set both width and height instead of using aspectRatio
3. Added `resizeMode: 'contain'` to ensure the image scales properly within its container without being cut off

If the image is still being cut off, you might want to check:
1. The actual dimensions of your chat-bubble-dark.png image
2. The values of `theme.avatarSize.lg` and `theme.avatarSize.sm` to ensure there's enough space for the image

---



---

