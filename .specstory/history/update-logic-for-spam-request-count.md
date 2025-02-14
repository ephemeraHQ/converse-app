## SpecStory

## Update Logic for Spam Request Count (1/17/2025, 10:00:27 AM)

_**User**_

We should the number of requests liklelyNotSpam. If we have 0, we show "All clear"

---

_**Assistant**_

I'll help add the count logic and update the subtitle text based on the number of `likelyNotSpam` requests. Here's the edit:

```typescript:features/conversation-list/conversation-list-awaiting-requests.tsx
// ... existing code ...
    const navigation = useNavigation();

    const count = likelyNotSpam.length;
    const subtitle = count === 0 ? "All clear" : `${count} awaiting your response`;

    return (
      <AnimatedVStack
// ... existing code ...
          subtitle={subtitle}
// ... existing code ...
```

I've made the following changes:
1. Added a `count` variable that gets the length of `likelyNotSpam` array
2. Created a `subtitle` variable that shows "All clear" when count is 0, otherwise shows the count with "awaiting your response"
3. Updated the `subtitle` prop to use this new variable

The changes follow the style guide by:
- Using clean, readable code with descriptive variable names
- Using early return logic via ternary for the subtitle text
- Keeping the code concise and focused

---



---

