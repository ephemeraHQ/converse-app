## SpecStory

## React useMemo Dependency Issue (1/31/2025, 9:53:18 AM)

_**User**_

why "go" doens'T log when i refersh convesation? "sentNs" value clearly change i can see it but it dones'T go in useMemo?

---

_**Assistant**_

The issue is likely related to how React's `useMemo` works with dependency tracking. Let's analyze and fix this:

1. The `useMemo` dependency array only includes `[conversation?.lastMessage?.sentNs, messageText]`, but you're accessing `conversation?.lastMessage` through optional chaining. React might not properly track nested object changes through optional chaining.

2. The `console.log("go")` might not be triggered because React is determining that the dependencies haven't changed, even though the nested value has.

Here's how to fix it:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-dm.tsx
// ... existing code ...
  const subtitle = useMemo(() => {
    // Using logger instead of console.log per style guide
    logger.debug(`[ConversationListItemDm] Recalculating subtitle`);
    
    const lastMessage = conversation?.lastMessage;
    const timestamp = lastMessage?.sentNs ?? 0;
    const timeToShow = getCompactRelativeTime(timestamp);

    if (!timeToShow || !messageText) {
      return "";
    }

    return `${timeToShow} ${MIDDLE_DOT} ${messageText}`;
  }, [conversation?.lastMessage, messageText]); // Track the entire lastMessage object
// ... existing code ...
```

The changes:
1. Changed the dependency to track the entire `lastMessage` object instead of just `sentNs`
2. Replaced `console.log` with `logger.debug` per style guide
3. Destructured `lastMessage` first for better readability

This should now properly trigger the memo recalculation when the conversation's last message changes.

---

_**User**_

ahh no the problem is because we might not want touse usememo for timetoShow... because i want that every time we refresh we show the updated time but if it's in useMemo it won't retrigger you know?

---

_**Assistant**_

Ah yes, you're absolutely right! The `getCompactRelativeTime` should be recalculated on every render to show updated relative times (like changing from "2m ago" to "3m ago"). Let's move that calculation outside of `useMemo`:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-dm.tsx
// ... existing code ...
  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getCompactRelativeTime(timestamp);

  const subtitle = useMemo(() => {
    if (!timeToShow || !messageText) {
      return "";
    }

    return `${timeToShow} ${MIDDLE_DOT} ${messageText}`;
  }, [timeToShow, messageText]);
// ... existing code ...
```

Now:
1. `timeToShow` will be recalculated on every render, giving us fresh relative time strings
2. The `useMemo` only handles the string concatenation, which is still useful to prevent unnecessary string operations if only one of the dependencies changes
3. The time will update properly when the component re-renders

---



---

