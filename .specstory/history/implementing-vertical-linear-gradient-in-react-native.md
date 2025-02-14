## SpecStory

## Implementing Vertical Linear Gradient in React Native (1/29/2025, 9:40:51 AM)

_**User**_

add a Lineargradient on top that will be 70% white and then the rest transparent at the top. It's vertical gradient. Full height of the container

---

_**Assistant**_

I'll help you add a LinearGradient overlay to create a fade effect at the top of the ConversationListEmpty component. We'll need to wrap the content in a View to position the gradient correctly.

```typescript:features/conversation-list/conversation-list-empty.tsx
import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

// ... existing code ...

const ConversationListSkeletons = memo(function ConversationListSkeletons() {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['white', 'transparent']}
        locations={[0.7, 1]}
        style={styles.gradient}
      />
      <AnimatedVStack entering={theme.animation.reanimatedFadeInSpring}>
        {/* ... existing code ... */}
      </AnimatedVStack>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
```

I've made the following changes:
1. Added imports for View, StyleSheet, and LinearGradient
2. Wrapped the AnimatedVStack in a container View
3. Added a LinearGradient component that overlays the content
4. Created styles for positioning the gradient and container
5. Set the gradient to be 70% white (0.7 in locations) and then fade to transparent

The gradient will create a fade effect from top to bottom, with the top 70% being white and then transitioning to transparent for the remaining 30%.

---



---

