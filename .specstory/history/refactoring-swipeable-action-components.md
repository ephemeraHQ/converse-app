## SpecStory

## Refactoring Swipeable Action Components (1/9/2025, 2:23:49 PM)

_**User**_

put those as external componetn

---

_**Assistant**_

I'll help you extract those swipeable action components into separate components within the same file, following the style guide.

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
// ... existing imports ...

type SwipeableActionsProps = {
  onDelete: () => void;
  theme: ReturnType<typeof useAppTheme>["theme"];
};

const RightSwipeableActions = memo(({ onDelete, theme }: SwipeableActionsProps) => (
  <ConversationListItemSwipeableAction
    icon="trash"
    color={theme.colors.fill.caution}
    onPress={onDelete}
  />
));

const LeftSwipeableActions = memo(({ onDelete }: Pick<SwipeableActionsProps, "onDelete">) => (
  <ConversationListItemSwipeableDeleteAction onPress={onDelete} />
));

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  // ... existing code ...

  const handleDelete = useCallback(() => {
    console.log("delete");
  }, []);

  const rightActions = useCallback(() => (
    <RightSwipeableActions onDelete={handleDelete} theme={theme} />
  ), [handleDelete, theme]);

  const leftActions = useCallback(() => (
    <LeftSwipeableActions onDelete={handleDelete} />
  ), [handleDelete]);

  // ... rest of the component
```

Key changes made:
1. Created two new memoized components: `RightSwipeableActions` and `LeftSwipeableActions`
2. Added proper TypeScript types for the props
3. Extracted the delete handler into a separate callback
4. Updated the action renderers to use the new components
5. Following the style guide by using memo() for performance and keeping components in the same file

---



---

