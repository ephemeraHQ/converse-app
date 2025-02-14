## SpecStory

## Reviewing Swipeable Component Logic and Props (1/9/2025, 10:03:58 AM)

_**User**_

Does my logic makes sense? like the props and etc. Trying to make it reable and usable for others

---

_**Assistant**_

I'll review your Swipeable component implementation. Overall, the code is well-structured and follows good TypeScript practices. Here's my analysis:

### Strengths:
1. **Type Safety**
   - Good use of TypeScript types with proper extension of `SwipeableProps`
   - Avoiding `any` as per style guide
   - Clear prop interface definition with `ISwipeableProps`

2. **Component Structure**
   - Clean separation into three components: `Swipeable`, `SwipeableLeftAction`, and `SwipeableRightAction`
   - Good use of function components
   - Props follow the style guide with clear naming conventions

3. **Callback Handling**
   - Proper use of `useCallback` for memoization
   - Clear direction handling with type safety (`"left" | "right"`)

### Suggestions for Improvement:

1. **Props Organization**
```typescript:components/swipeable.tsx
// Consider grouping related props in the interface
export type ISwipeableProps = {
  // Action renderers
  renderLeftActions?: SwipeableProps["renderLeftActions"];
  renderRightActions?: SwipeableProps["renderRightActions"];
  
  // Swipe callbacks
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onWillLeftSwipe?: () => void;
  onWillRightSwipe?: () => void;
  
  // Action callbacks
  onLeftActionPress?: () => void;  // Note: This prop is defined but not used
  onRightActionPress?: () => void; // Note: This prop is defined but not used
  
  // Configuration
  overshootLeft?: boolean;
  dragOffsetFromLeftEdge?: number;
  
  children: React.ReactNode;
};
```

2. **Action Components Props**
```typescript:components/swipeable.tsx
// Consider creating interfaces for action components
type ISwipeableActionProps = {
  icon: IIconName;
  onPress?: () => void;
};

type ISwipeableRightActionProps = {
  isDestructive?: boolean;
  onPress?: () => void;
};
```

3. **Unused Props**
- `onLeftActionPress` and `onRightActionPress` are defined in the interface but not used in the component. Either remove them or implement their functionality.

4. **Theme Usage**
- Good use of theme following the style guide, but consider extracting common theme values if they're used across multiple components.

The component is quite readable and follows a logical structure. The separation of concerns between the main swipeable component and its action components is good. The props make sense for the functionality provided, though you might want to address the unused action press props.

Would you like me to suggest any specific improvements or have questions about any particular aspect of the implementation?

---

_**User**_

For the code present, we get this error:
```
Type '{ ref: RefObject<Swipeable>; onPress: () => void; onRightSwipe: () => void; onLeftSwipe: () => void; onWillRightSwipe: () => void; onWillLeftSwipe: () => void; leftActionIcon: "message.badge" | "checkmark.message"; ... 7 more ...; rightIsDestructive: boolean; }' is not assignable to type 'IntrinsicAttributes & IConversationListItemProps'.
  Property 'ref' does not exist on type 'IntrinsicAttributes & IConversationListItemProps'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because you need to forward the ref properly in the `ConversationListItem` component. Here's how to fix it:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item.tsx
// Change the export from:
export function ConversationListItem({ ... }) {
// to:
export const ConversationListItem = forwardRef<Swipeable, IConversationListItemProps>((props, ref) => {
  // ... rest of the component code ...
});
```

Make sure to import `forwardRef` from React:
```typescript
import { forwardRef } from 'react';
```

This allows the ref to be properly passed down to the underlying Swipeable component.

---



---

