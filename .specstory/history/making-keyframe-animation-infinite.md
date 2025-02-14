## SpecStory

## Making Keyframe Animation Infinite (1/29/2025, 9:18:41 AM)

_**User**_

hwo can i make. a keyframe animation last forever

---

_**Assistant**_

To make a Keyframe animation repeat indefinitely, you can use the `withRepeat` modifier from Reanimated. Here's how to modify the code:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
  const entering = new Keyframe({
    0: {
      transform: [{ translateY: 0 }],
    },
    50: {
      transform: [{ translateY: -25 }],
    },
    100: {
      transform: [{ translateY: 0 }],
    },
  }).duration(2000).withRepeat(-1); // -1 means infinite repetition
// ... existing code ...
```

The `withRepeat(-1)` modifier makes the animation repeat infinitely. If you wanted it to repeat a specific number of times instead, you could replace -1 with that number (e.g., `withRepeat(5)` would repeat 5 times).

---

_**User**_

there are no withRepaet. 



---

_**Assistant**_

Ah, you're right - I apologize for the confusion. For Keyframe animations in React Native Reanimated, we need to use a different approach since `withRepeat` isn't available directly on the Keyframe class. Instead, we can use `useEffect` with a repeating animation using `withRepeat` and `withTiming` or create a continuous loop using state.

Here's how we can modify the code to create an infinite animation:

```typescript:features/conversation-list/conversation-list.screen.tsx
const StartNewConversationBanner = memo(function StartNewConversationBanner() {
  const { theme } = useAppTheme();
  const { screenHorizontalPadding } = useConversationListStyles();
  
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-25, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // -1 for infinite repeats
      true  // reverse animation
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <HStack
      style={{
        backgroundColor: theme.colors.fill.minimal,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.xxs,
        columnGap: theme.spacing.sm,
        alignItems: "center",
        marginHorizontal: screenHorizontalPadding,
        marginBottom: theme.spacing.xs,
      }}
    >
      <VStack
        style={{
          rowGap: theme.spacing.xxxs,
          flex: 1,
        }}
      >
        <Text>Start a conversation</Text>
        <Text color="secondary" size="sm">
          Invite a friend, or send a message
        </Text>
      </VStack>
      <AnimatedCenter style={animatedStyle}>
        <Icon
          size={theme.iconSize.md}
          color={theme.colors.text.secondary}
          icon="chevron.up"
        />
      </AnimatedCenter>
    </HStack>
  );
});
```

This approach uses `useSharedValue`, `withRepeat`, and `withTiming` to create a smooth, infinite animation. The chevron will continuously move up and down forever. The animation will be smoother than the keyframe version since it uses timing functions.

Make sure to import these additional functions from Reanimated at the top of the file if they're not already imported:

```typescript:features/conversation-list/conversation-list.screen.tsx
import {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
```

---

_**User**_

ok nevemrenind , try doing something like this:

import {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const useAnimatedShake = () => {
  const shakeTranslateX = useSharedValue(0);

  const shake = useCallback(() => {
    const TranslationAmount = 10;
    const timingConfig = {
      // cubic-bezier(.35,.7,.5,.7)
      easing: Easing.bezier(0.35, 0.7, 0.5, 0.7),
      duration: 80,
    };
    shakeTranslateX.value = withSequence(
      withTiming(TranslationAmount, timingConfig),
      withRepeat(withTiming(-TranslationAmount, timingConfig), 3, true),
      withSpring(0, {
        mass: 0.5,
      })
    );
  }, []);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslateX.value }],
    };
  }, []);

  const isShaking = useDerivedValue(() => {
    return shakeTranslateX.value !== 0;
  }, []);

  return { shake, rStyle, isShaking };
};



---

_**Assistant**_

I'll help you create a similar animation hook for the continuous up and down movement. Here's how we can implement it:

```typescript:features/conversation-list/conversation-list.screen.tsx
const useAnimatedUpDown = () => {
  const translateY = useSharedValue(0);

  const startAnimation = useCallback(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-25, {
          duration: 1000,
          easing: Easing.bezier(0.35, 0.7, 0.5, 0.7),
        }),
        withTiming(0, {
          duration: 1000,
          easing: Easing.bezier(0.35, 0.7, 0.5, 0.7),
        })
      ),
      -1, // infinite repeats
      true // reverse animation
    );
  }, []);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  }, []);

  const isAnimating = useDerivedValue(() => {
    return translateY.value !== 0;
  }, []);

  return { startAnimation, rStyle, isAnimating };
};

const StartNewConversationBanner = memo(function StartNewConversationBanner() {
  const { theme } = useAppTheme();
  const { screenHorizontalPadding } = useConversationListStyles();
  const { startAnimation, rStyle } = useAnimatedUpDown();

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <HStack
      style={{
        backgroundColor: theme.colors.fill.minimal,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.xxs,
        columnGap: theme.spacing.sm,
        alignItems: "center",
        marginHorizontal: screenHorizontalPadding,
        marginBottom: theme.spacing.xs,
      }}
    >
      <VStack
        style={{
          rowGap: theme.spacing.xxxs,
          flex: 1,
        }}
      >
        <Text>Start a conversation</Text>
        <Text color="secondary" size="sm">
          Invite a friend, or send a message
        </Text>
      </VStack>
      <AnimatedCenter style={rStyle}>
        <Icon
          size={theme.iconSize.md}
          color={theme.colors.text.secondary}
          icon="chevron.up"
        />
      </AnimatedCenter>
    </HStack>
  );
});
```

This creates a reusable animation hook that:
1. Uses `withRepeat` for infinite animation
2. Uses `withSequence` to create a smooth up and down movement
3. Uses a bezier curve easing for smooth animation
4. Provides the animation style and control functions similar to the shake animation

The animation will start automatically when the component mounts and continue indefinitely. You can adjust the timing and easing values to get the exact feel you want.

---

_**User**_

For the code present, we get this error:
```
The result of useQueries is not referentially stable, so don't pass it directly into the dependencies array of useMemo. Instead, destructure the return value of useQueries and pass the destructured values into the dependency array of useMemo.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's how to fix the referential stability issue by destructuring the query results:

```typescript:features/conversation-list/use-conversation-list-conversations.tsx
// ... existing code ...
  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations) return [];

    // Extract stable values from queries
    const metadataResults = conversationsMetadataQueries.map(query => ({
      isPinned: query.data?.isPinned,
      isDeleted: query.data?.isDeleted,
      isLoading: query.isLoading
    }));

    // Filter out conversations that don't meet criteria
    const filtered = conversations.filter((conversation, index) => {
      const metadata = metadataResults[index];
      const isAllowed = isConversationAllowed(conversation);
      return isAllowed && !metadata.isPinned && !metadata.isDeleted && !metadata.isLoading;
    });

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const timestampA = a.lastMessage?.sentNs ?? 0;
      const timestampB = b.lastMessage?.sentNs ?? 0;
      return timestampB - timestampA;
    });
  }, [conversations, conversationsMetadataQueries.map(q => [q.data?.isPinned, q.data?.isDeleted, q.isLoading])]);
// ... existing code ...
```

This extracts only the needed values from the queries and creates a stable dependency array.

---



---

