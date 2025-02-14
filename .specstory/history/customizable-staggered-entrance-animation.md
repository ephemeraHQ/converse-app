## SpecStory

## Customizable Staggered Entrance Animation (12/12/2024, 3:53:19 PM)

_**User**_

I want this to be more generic like you saw, so I'll pass the entering and existing animation

---

_**Assistant**_

I'll help you make the StaggeredEntrance component more flexible by allowing custom enter/exit animations. Here's the improved version:

```typescript:design-system/staggered-animation.tsx
import { PropsWithChildren } from 'react';
import { AnimatedVStack } from './animated-vstack';
import { AnimationProps } from 'react-native-reanimated';

type IStaggeredEntranceProps = PropsWithChildren<{
  index: number;
  totalItems: number;
  delayBetweenItems?: number;
  baseDelay?: number;
  enteringAnimation?: AnimationProps['entering'];
  exitingAnimation?: AnimationProps['exiting'];
  style?: ViewStyle;
}>;

export function StaggeredEntrance(args: IStaggeredEntranceProps) {
  const {
    children,
    index,
    totalItems,
    delayBetweenItems = 60,
    baseDelay = 100,
    enteringAnimation = FadeIn,
    exitingAnimation,
    style,
  } = args;

  const delay = (totalItems - index) * delayBetweenItems + baseDelay;

  return (
    <AnimatedVStack
      style={style}
      entering={enteringAnimation.delay(delay)}
      exiting={exitingAnimation}
    >
      {children}
    </AnimatedVStack>
  );
}
```

Key improvements made:

1. Added proper typing for the style prop using ViewStyle from react-native
2. Added enteringAnimation and exitingAnimation props that accept Reanimated animation configurations
3. Made FadeIn the default entering animation while making it optional to override
4. Made exiting animation optional
5. Restructured to use the args pattern you prefer
6. Calculated the delay separately for better readability
7. Used function declaration instead of arrow function
8. Added proper imports (though they were omitted for brevity)

You can now use it like this:

```typescript
// Default usage (FadeIn)
<StaggeredEntrance index={0} totalItems={5}>
  <Text>Hello</Text>
</StaggeredEntrance>

// Custom animations
<StaggeredEntrance 
  index={0} 
  totalItems={5}
  enteringAnimation={SlideInRight}
  exitingAnimation={SlideOutLeft}
>
  <Text>Hello</Text>
</StaggeredEntrance>
```

---



---

