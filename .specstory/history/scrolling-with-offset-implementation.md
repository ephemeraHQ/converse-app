## SpecStory

## Scrolling with Offset Implementation (12/19/2024, 11:08:21 AM)

_**User**_

possible to scroll but with an offset?

---

_**Assistant**_

Yes, you can add an offset when scrolling using the `viewOffset` or `viewPosition` properties in `scrollToIndex`. Here's how you can modify the code:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...
        scrollRef.current?.scrollToIndex({
          index: messageIds.indexOf(scrollToMessageId),
          animated: true,
          viewOffset: 100, // Adds 100 pixels of offset from the top/bottom
          // alternatively, use viewPosition
          // viewPosition: 0.3, // 0 = top, 0.5 = center, 1 = bottom
        });
// ... existing code ...
```

A few notes:
- `viewOffset` adds a specific number of pixels as padding
- `viewPosition` is a value between 0 and 1 that determines where the item should be positioned in the visible area
- Since your list is `inverted={true}`, the offset will work from the bottom instead of the top
- You might need to adjust the values based on your UI needs and the size of your messages

Choose either `viewOffset` or `viewPosition` depending on whether you want an absolute pixel offset or a relative position in the viewport.

---



---

