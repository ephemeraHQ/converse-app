## SpecStory

## Maintaining Image Aspect Ratio in React Native (1/13/2025, 9:20:50 AM)

_**User**_

In react-antive i have a local image, I want the image to respect it's aspect ratio size. but like I want to give it a height and i want the widtth to respect

---

_**Assistant**_

I'll help you modify the Image component to maintain aspect ratio while setting a specific height. Here's how to update the code:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
          <Image
            source={require("@/assets/icons/chat-bubble-dark.png")}
            style={{
              height: theme.avatarSize.sm,
              width: undefined,
              aspectRatio: 1, // Adjust this value based on your image's actual aspect ratio
            }}
          />
// ... existing code ...
```

The key changes are:
1. Set a fixed `height` instead of width
2. Set `width` to `undefined` to allow it to be calculated based on the aspect ratio
3. Add `aspectRatio` property (use the actual aspect ratio of your image - if it's square, use 1)

Alternatively, you could use the `AutoImage` component that's already imported in your file, which automatically handles aspect ratio:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
          <AutoImage
            source={require("@/assets/icons/chat-bubble-dark.png")}
            style={{
              height: theme.avatarSize.sm,
            }}
          />
// ... existing code ...
```

The `AutoImage` component is typically designed to automatically maintain the correct aspect ratio while only needing to specify either width or height.

---



---

