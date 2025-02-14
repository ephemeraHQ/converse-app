## SpecStory

## Optimizing Animated Text Carousel Rendering (1/29/2025, 5:26:44 PM)

_**User**_

could we make it better that always only render 2 components? And we alternate the text between like currentText and nextText based on which index we are at?

---

_**Assistant**_

Yes, we can optimize the `AnimatedTextCarousel` to only render two text components and alternate between them. This would be more performant than rendering all texts at once. Here's the improved version:

```typescript:components/animated-text-carousel.tsx
import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { ITextProps } from "@/design-system/Text/Text.props";
import React, { memo, useEffect } from "react";
import {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type IAnimatedTextCarouselProps = {
  texts: string[];
  textStyle?: ITextProps["style"];
  msDelayBetweenTextChange?: number;
};

export const AnimatedTextCarousel = memo(function AnimatedTextCarousel({
  texts,
  msDelayBetweenTextChange = 2,
  textStyle,
}: IAnimatedTextCarouselProps) {
  const progressAV = useSharedValue(0);

  useEffect(() => {
    progressAV.value = 0;
    progressAV.value = withRepeat(
      withTiming(texts.length * msDelayBetweenTextChange, {
        duration: texts.length * msDelayBetweenTextChange * 1000,
      }),
      -1,
      false
    );
  }, []);

  return (
    <AnimatedCenter style={{ width: "100%" }}>
      <CarouselText
        texts={texts}
        progressAV={progressAV}
        msDelayBetweenTextChange={msDelayBetweenTextChange}
        style={textStyle}
        isFirst={true}
      />
      <CarouselText
        texts={texts}
        progressAV={progressAV}
        msDelayBetweenTextChange={msDelayBetweenTextChange}
        style={textStyle}
        isFirst={false}
      />
    </AnimatedCenter>
  );
});

type ICarouselTextProps = {
  texts: string[];
  progressAV: SharedValue<number>;
  msDelayBetweenTextChange: number;
  style?: ITextProps["style"];
  isFirst: boolean;
};

const CarouselText = memo(function CarouselText({
  texts,
  progressAV,
  msDelayBetweenTextChange,
  style,
  isFirst,
}: ICarouselTextProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const currentIndex = Math.floor(progressAV.value / msDelayBetweenTextChange);
    const nextIndex = (currentIndex + 1) % texts.length;
    
    const textIndex = isFirst ? currentIndex : nextIndex;
    const progress = (progressAV.value % msDelayBetweenTextChange) / msDelayBetweenTextChange;
    
    const opacity = interpolate(
      progress,
      [0, 0.4, 0.6, 1],
      isFirst ? [1, 1, 0, 0] : [0, 0, 1, 1],
      "clamp"
    );

    return {
      opacity,
      position: "absolute",
      zIndex: isFirst ? 1 : 0,
    };
  });

  return (
    <AnimatedHStack style={animatedStyle}>
      <Text style={[style]}>{texts[Math.floor((progressAV.value / msDelayBetweenTextChange) % texts.length)]}</Text>
    </AnimatedHStack>
  );
});
```

This improved version:

1. Only renders two text components instead of one for each text
2. Uses a single animated value to control both components
3. Alternates between the two components by interpolating their opacity based on progress
4. Maintains the same smooth transition effect
5. Is more performant since we're not creating multiple animation instances

The main changes from the original version (referenced in `components/animated-text-carousel.tsx` lines 1-102) are:

1. Removed the need for multiple `AnimatedText` components
2. Simplified the animation logic to work with just two alternating components
3. Improved the opacity interpolation to create a smoother crossfade effect
4. Reduced the number of animated style calculations

The component can be used exactly the same way as before:

```typescript
<AnimatedTextCarousel 
  texts={["Hello", "Hallo", "Bonjour", "Hola"]} 
  msDelayBetweenTextChange={2}
/>
```

---

_**User**_

ok new way of doing it. Just use AnimatableText and text props will be a useDeriveValue of the texts[index] and index will be a sharedValue and it will be changed every "msDelayBetweenTextChange" to the next one until we reached the end and then we restart and set it back to index = 0

---

_**Assistant**_

Yes, that's an even simpler and more efficient approach using `AnimatableText`. Here's the implementation:

```typescript:components/animated-text-carousel.tsx
import { AnimatedCenter } from "@/design-system/Center";
import { AnimatableText } from "@/design-system/Text";
import { ITextProps } from "@/design-system/Text/Text.props";
import React, { memo, useEffect } from "react";
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type IAnimatedTextCarouselProps = {
  texts: string[];
  textStyle?: ITextProps["style"];
  msDelayBetweenTextChange?: number;
};

export const AnimatedTextCarousel = memo(function AnimatedTextCarousel({
  texts,
  msDelayBetweenTextChange = 2,
  textStyle,
}: IAnimatedTextCarouselProps) {
  const indexAV = useSharedValue(0);

  const textAV = useDerivedValue(() => {
    return texts[Math.floor(indexAV.value) % texts.length];
  });

  useEffect(() => {
    // Create sequence for each text transition
    const sequence = texts.map((_, index) =>
      withTiming(index, {
        duration: msDelayBetweenTextChange * 1000,
      })
    );

    indexAV.value = 0;
    indexAV.value = withRepeat(
      withSequence(...sequence),
      -1, // infinite repeat
      false // don't reverse
    );
  }, [texts, msDelayBetweenTextChange]);

  return (
    <AnimatedCenter style={{ width: "100%" }}>
      <AnimatableText text={textAV} style={textStyle} />
    </AnimatedCenter>
  );
});
```

This version:

1. Uses a single `indexAV` shared value to track the current text index
2. Uses `useDerivedValue` to automatically compute the current text based on the index
3. Uses `AnimatableText` which is optimized for text content changes
4. Creates a smooth sequence of transitions between all texts
5. Is more performant as it only needs to manage a single number animation
6. Has simpler, more maintainable code

The component usage remains the same:

```typescript
<AnimatedTextCarousel 
  texts={["Hello", "Hallo", "Bonjour", "Hola"]} 
  msDelayBetweenTextChange={2}
/>
```

This approach is more efficient because:
- Only one text component is rendered
- Text changes are handled by the optimized `AnimatableText` component
- Animation logic is simplified to just incrementing a number
- No need for complex opacity interpolations or multiple components

---

_**User**_

oh i forgot we also need to add opacity animated style so that it fades in and fade out

---

_**Assistant**_

Here's the updated version with fade in/out animations:

```typescript:components/animated-text-carousel.tsx
import { AnimatedCenter } from "@/design-system/Center";
import { AnimatableText } from "@/design-system/Text";
import { ITextProps } from "@/design-system/Text/Text.props";
import React, { memo, useEffect } from "react";
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

type IAnimatedTextCarouselProps = {
  texts: string[];
  textStyle?: ITextProps["style"];
  msDelayBetweenTextChange?: number;
};

export const AnimatedTextCarousel = memo(function AnimatedTextCarousel({
  texts,
  msDelayBetweenTextChange = 2000,
  textStyle,
}: IAnimatedTextCarouselProps) {
  const indexAV = useSharedValue(0);

  const textAV = useDerivedValue(() => {
    return texts[Math.floor(indexAV.value) % texts.length];
  });

  const animatedStyle = useAnimatedStyle(() => {
    const progress = indexAV.value % 1;
    const opacity = interpolate(
      progress,
      [0, 0.4, 0.6, 1],
      [1, 0, 0, 1],
      "clamp"
    );

    return {
      opacity,
    };
  });

  useEffect(() => {
    // Create sequence for each text transition
    const sequence = texts.map((_, index) =>
      withTiming(index, {
        duration: msDelayBetweenTextChange,
      })
    );

    indexAV.value = 0;
    indexAV.value = withRepeat(
      withSequence(...sequence),
      -1, // infinite repeat
      false // don't reverse
    );
  }, [texts, msDelayBetweenTextChange]);

  return (
    <AnimatedCenter style={{ width: "100%" }}>
      <AnimatableText text={textAV} style={[textStyle, animatedStyle]} />
    </AnimatedCenter>
  );
});
```

Key changes:
1. Added `useAnimatedStyle` to create a fade effect
2. Used `interpolate` to create smooth opacity transitions based on the progress between indices
3. Changed default `msDelayBetweenTextChange` to 2000 (2 seconds) since we're no longer using seconds
4. Added the animated style to the `AnimatableText` component's style prop

The opacity interpolation:
- When progress is 0-0.4: Text is visible and starts fading out
- When progress is 0.4-0.6: Text is fully transparent for the change
- When progress is 0.6-1: New text fades in
- This creates a smooth crossfade effect between text changes

---



---

