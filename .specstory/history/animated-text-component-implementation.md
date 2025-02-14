## SpecStory

## Animated Text Component Implementation (1/29/2025, 1:45:34 PM)

_**User**_

do something like this. Not hte right improts tho

// TODO: Use Skia text instead
import { useTheme } from "native-base"
import { StyleProp, TextInputProps, TextProps, TextStyle } from "react-native"
import AnimateableText from "react-native-animateable-text"
import Animated, { useAnimatedProps } from "react-native-reanimated"
import {
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_FONT_WEIGHT,
  getTextFontSizeForString,
} from "./text"

export type IAnimatedTextProps = TextProps & {
  style?: StyleProp<Animated.AnimateStyle<StyleProp<TextStyle>>>
  text: Animated.SharedValue<string>
}

export const AnimatedText = ({ style, text, ...rest }: IAnimatedTextProps) => {
  const theme = useTheme()

  const animatedProps = useAnimatedProps(() => {
    if (text === undefined) {
      return {}
    }
    return {
      text: text.value == "0" ? "1" : text.value,
    } as unknown as TextInputProps
  }, [text])

  return (
    <AnimateableText
      animatedProps={animatedProps}
      style={[
        {
          fontSize: getTextFontSizeForString(DEFAULT_TEXT_FONT_SIZE),
          fontWeight: DEFAULT_TEXT_FONT_WEIGHT,
          color: theme.colors.content.default,
        },
        style,
      ]}
      // same other props as Text component
      {...rest}
    />
  )
}


---

_**Assistant**_

I'll help you clean up and implement the AnimatedText component following the style guide. Here's the corrected version:

```typescript:design-system/Text/AnimatedText.tsx
import Animated, { useAnimatedProps } from "react-native-reanimated";
import AnimateableText from "react-native-animateable-text";
import { StyleProp, TextStyle } from "react-native";

import { ITextProps } from "./Text.props";
import { useAppTheme } from "@/theme/useAppTheme";

type IAnimatedTextProps = ITextProps & {
  style?: StyleProp<Animated.AnimateStyle<StyleProp<TextStyle>>>;
  text: Animated.SharedValue<string>;
};

export function AnimatedText({ style, text, ...rest }: IAnimatedTextProps) {
  const { theme } = useAppTheme();

  const animatedProps = useAnimatedProps(() => {
    if (!text) {
      return {};
    }
    return {
      text: text.value === "0" ? "1" : text.value,
    };
  }, [text]);

  return (
    <AnimateableText
      animatedProps={animatedProps}
      style={[
        {
          color: theme.colors.text.primary,
        },
        style,
      ]}
      {...rest}
    />
  );
}
```

Key changes made:
1. Removed unused imports and simplified the necessary ones
2. Used `useAppTheme` instead of native-base's `useTheme`
3. Properly typed the `IAnimatedTextProps` using the existing `ITextProps`
4. Removed unnecessary type casting and simplified the `animatedProps` logic
5. Removed default text styling (fontSize and fontWeight) since they should come from the theme or be passed as props
6. Used proper theme color token (`theme.colors.text.primary`)
7. Used function declaration instead of const arrow function per style guide
8. Removed TODO comment since we're implementing the component now

The component now follows the style guide while maintaining the animated text functionality. It extends the base Text component props while adding animation capabilities.

---

_**User**_

For the code present, we get this error:
```
Argument of type '() => { text?: undefined; } | { text: string; }' is not assignable to parameter of type '() => Partial<{ text: undefined; }>'.
  Type '{ text?: undefined; } | { text: string; }' is not assignable to type 'Partial<{ text: undefined; }>'.
    Type '{ text: string; }' is not assignable to type 'Partial<{ text: undefined; }>'.
      Types of property 'text' are incompatible.
        Type 'string' is not assignable to type 'undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the fix for the type error:

```typescript:design-system/Text/AnimatedText.tsx
// ... existing code ...
  const animatedProps = useAnimatedProps<{ text: string }>(() => {
    if (!text) {
      return { text: '' };
    }
    return {
      text: text.value === "0" ? "1" : text.value,
    };
  }, [text]);
// ... existing code ...
```

The key changes are:
1. Added type parameter to `useAnimatedProps`
2. Return empty string instead of empty object when text is null
3. Always return an object with a `text` property

This ensures the return type is consistent and matches what AnimateableText expects.

---



---

