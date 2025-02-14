## SpecStory

## Animated Text Carousel Component Design (1/29/2025, 4:10:51 PM)

_**User**_

i want a component that will animate textst on top of each others with 2 delay before switching, so we pass props a texts: string[] and then we render all the text on top of each otehrs and each having their own animatedStyle because the first text will ahve zIndex = 1 , and the rest will have zIndex -1 and then we will also interpolate the opacity. the root component will have a SharedValue reprensing the time and based on that we will know when to fadeOut and FadeIn which text

---

_**Assistant**_

I'll help you create an animated text carousel component. Here's how we can implement it:

```typescript:features/conversation-list/animated-text-carousel.tsx
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo, useEffect } from "react";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type IAnimatedTextCarouselProps = {
  texts: string[];
  preset?: React.ComponentProps<typeof Text>["preset"];
  color?: React.ComponentProps<typeof Text>["color"];
  delayBetweenTexts?: number; // in seconds
};

export const AnimatedTextCarousel = memo(function AnimatedTextCarousel({
  texts,
  preset = "body",
  color = "primary",
  delayBetweenTexts = 2,
}: IAnimatedTextCarouselProps) {
  const { themed } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(texts.length * delayBetweenTexts, {
      duration: texts.length * delayBetweenTexts * 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ position: "relative" }}>
      {texts.map((text, index) => (
        <AnimatedText
          key={text}
          text={text}
          index={index}
          progress={progress}
          delayBetweenTexts={delayBetweenTexts}
          preset={preset}
          color={color}
        />
      ))}
    </Animated.View>
  );
});

type IAnimatedTextProps = {
  text: string;
  index: number;
  progress: SharedValue<number>;
  delayBetweenTexts: number;
  preset: React.ComponentProps<typeof Text>["preset"];
  color: React.ComponentProps<typeof Text>["color"];
};

const AnimatedText = memo(function AnimatedText({
  text,
  index,
  progress,
  delayBetweenTexts,
  preset,
  color,
}: IAnimatedTextProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const start = index * delayBetweenTexts;
    const end = (index + 1) * delayBetweenTexts;

    const opacity = interpolate(
      progress.value,
      [start, start + 0.5, end - 0.5, end],
      [0, 1, 1, 0],
      "clamp"
    );

    return {
      opacity,
      position: "absolute",
      zIndex: index === Math.floor(progress.value / delayBetweenTexts) ? 1 : -1,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Text preset={preset} color={color}>
        {text}
      </Text>
    </Animated.View>
  );
});
```

This component creates a text carousel where texts fade in and out on top of each other. Here's how it works:

1. The main component `AnimatedTextCarousel` takes an array of texts and optional styling props
2. It uses a shared value `progress` that increases over time to control the animations
3. Each text is rendered using the `AnimatedText` component which:
   - Calculates its opacity based on the progress value
   - Sets its zIndex to 1 when it's the current text, -1 otherwise
   - Uses interpolate to create smooth fade in/out transitions

You can use it like this:

```typescript
<AnimatedTextCarousel 
  texts={[
    "Loading your messages...",
    "This might take a moment...",
    "Almost there...",
  ]}
  preset="bodyBold"
  color="secondary"
/>
```

The texts will cycle through with a 2-second delay between each transition, with smooth fade in/out animations. Each text will be positioned absolutely in the same spot, and the zIndex handling ensures clean transitions between texts.

---



---

