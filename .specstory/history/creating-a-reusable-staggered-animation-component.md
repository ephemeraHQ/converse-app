## SpecStory

## Creating a Reusable Staggered Animation Component (12/12/2024, 3:52:27 PM)

_**User**_

like in the comment how can i make a reusable component that will do that?

---

_**Assistant**_

I'll help you create a reusable staggered animation component using react-native-reanimated. Here's how we can implement it:

First, let's create a new component:

```typescript:design-system/StaggeredEntrance/StaggeredEntrance.tsx
import { PropsWithChildren } from "react";
import { AnimatedVStack } from "@/design-system/VStack";
import { FadeIn } from "react-native-reanimated";

type IStaggeredEntranceProps = PropsWithChildren<{
  index: number;
  totalItems: number;
  delayBetweenItems?: number;
  baseDelay?: number;
  style?: any; // You might want to properly type this based on your VStack props
}>;

export const StaggeredEntrance = ({
  children,
  index,
  totalItems,
  delayBetweenItems = 60,
  baseDelay = 100,
  style,
}: IStaggeredEntranceProps) => {
  return (
    <AnimatedVStack
      style={style}
      entering={FadeIn.delay((totalItems - index) * delayBetweenItems + baseDelay)}
    >
      {children}
    </AnimatedVStack>
  );
};
```

Then update your original code to use this component:

```typescript:features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-above-message-reactions.tsx
// ... existing code ...
{favoritedEmojis.getEmojis().map((emoji, index) => (
  <StaggeredEntrance
    key={emoji}
    index={index}
    totalItems={favoritedEmojis.getEmojis().length}
  >
    <Emoji
      content={emoji}
      alreadySelected={!!currentUserEmojiSelectedMap.get(emoji)}
      onSelectReaction={onSelectReaction}
    />
  </StaggeredEntrance>
))}
// ... existing code ...
```

This new component:
1. Is reusable across your app
2. Allows customization of delay between items and base delay
3. Maintains the same animation logic but in a cleaner package
4. Can be extended to support different animation types if needed

You can use it anywhere you need staggered animations, like:

```typescript
// Example usage in another component
{items.map((item, index) => (
  <StaggeredEntrance
    key={item.id}
    index={index}
    totalItems={items.length}
    delayBetweenItems={80}  // Custom delay
    baseDelay={150}         // Custom base delay
  >
    <YourComponent {...item} />
  </StaggeredEntrance>
))}
```

---



---

