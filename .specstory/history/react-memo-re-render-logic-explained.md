## SpecStory

## React Memo Re-render Logic Explained (12/11/2024, 5:33:10 PM)

_**User**_

will it rerender if true or false?

---

_**Assistant**_

Let me explain the memo behavior:

In React's `memo`, the function you provide is a comparison function that:
- Returns `true` if the props are equal (component should **NOT** re-render)
- Returns `false` if the props are different (component **SHOULD** re-render)

So in your code:
```typescript:features/conversation/conversation-message/conversation-message.tsx
(prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id;
}
```

- If the message IDs are the same (`true`): The component will **NOT** re-render
- If the message IDs are different (`false`): The component **WILL** re-render

Think of it as answering the question: "Are these props equal enough to skip a re-render?"
- `true` = Yes, they're equal, skip the re-render
- `false` = No, they're different, please re-render

---



---

