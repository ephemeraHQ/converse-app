## SpecStory

## Adjusting Row Gap in Chat Layout (1/30/2025, 4:01:03 PM)

_**User**_

i want a ['4xs'] spacing rowgap between each message and reactions

---

_**Assistant**_

I'll help you add a row gap between messages and reactions. Here's the modified code with the spacing change:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

      <VStack
        style={{
          rowGap: theme.spacing["4xs"],
          ...(!hasNextMessageInSeries &&
            nextMessage && {
              marginBottom: theme.spacing.sm,
            }),
        }}
      >
// ... existing code ...
```

I've added `rowGap: theme.spacing["4xs"]` to the main VStack container's style. This will create consistent vertical spacing between the message content, reactions, and message status sections. The rest of the file remains unchanged.

---



---

