## SpecStory

## Finding SF Symbols for Chat Bubbles (1/13/2025, 9:07:47 AM)

_**User**_

is there a sfsymbols for like a chat bubble

---

_**Assistant**_

Yes, there are several SF Symbols chat bubble icons available. Here are some common options:

1. `bubble.left` - Basic chat bubble pointing left
2. `bubble.right` - Basic chat bubble pointing right
3. `bubble.left.fill` - Filled chat bubble pointing left
4. `bubble.right.fill` - Filled chat bubble pointing right
5. `message` - Chat bubble with lines (like text)
6. `message.fill` - Filled chat bubble with lines

For your specific case, you could replace the shield icon with something like:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
          <Icon
            icon="bubble.left.fill"  // or "message.fill" depending on the look you want
            color={theme.colors.global.green}
            size={theme.iconSize.md}
          />
// ... existing code ...
```

Both `bubble.left.fill` or `message.fill` would be appropriate for representing chat requests. Choose whichever matches your app's visual style better.

---



---

