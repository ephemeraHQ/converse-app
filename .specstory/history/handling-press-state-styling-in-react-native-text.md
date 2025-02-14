## SpecStory

## Handling Press State Styling in React Native Text (11/14/2024, 10:59:48 AM)

_**User**_

If i pass onPress to a RN text, it applies some wierd stle fo the text, what can i do to apply different style when pressing on the text

---

_**Assistant**_

I understand you want to handle the press state styling for text elements. In React Native, when you add `onPress`, it adds a default opacity effect. We can use `Pressable` instead to have better control over the press state styling.

Here's how to modify the ParsedText component:

```typescript:components/ParsedText/ParsedText.tsx
import { ITextProps, Text } from "@design-system/Text";
import React, { ReactNode, forwardRef } from "react";
import { Text as RNText, Pressable } from "react-native";
// ... existing imports ...

// Add pressableStyle to the interface
export interface ParsedTextProps extends ITextProps {
  // ... existing props ...
  /** Style to apply when text is being pressed */
  pressableStyle?: ITextProps['style'];
}

export const ParsedText = forwardRef<RNText, ParsedTextProps>((props, ref) => {
  const { parse, childrenProps = {}, pressableStyle, ...rest } = props;

  // ... existing code ...

  const getParsedText = (): ReactNode => {
    // ... existing checks ...

    const patterns = getPatterns();
    const parsedParts = parseText({ text: props.children, patterns });

    return parsedParts.map((parsedProps, index) => {
      const { style: parentStyle } = props;
      const { style, children, _matched, onPress, ...remainderParsed } = parsedProps;

      // If there's an onPress handler, wrap with Pressable
      if (onPress) {
        return (
          <Pressable 
            key={`parsedText-${index}`}
            onPress={onPress}
          >
            {({ pressed }) => (
              <Text
                style={[
                  parentStyle, 
                  style,
                  pressed && pressableStyle
                ]}
                {...childrenProps}
                {...(remainderParsed as ITextProps)}
              >
                {children}
              </Text>
            )}
          </Pressable>
        );
      }

      // Return regular Text if no onPress
      return (
        <Text
          key={`parsedText-${index}`}
          style={[parentStyle, style]}
          {...childrenProps}
          {...(remainderParsed as ITextProps)}
        >
          {children}
        </Text>
      );
    });
  };

  // ... rest of the component
});
```

Now you can use it like this:

```typescript
<ParsedText
  parse={[
    {
      pattern: /@(\w+)/,
      style: { color: 'blue' },
      pressableStyle: { opacity: 0.7 },
      onPress: (username) => handleUserPress(username)
    }
  ]}
>
  Hello @john!
</ParsedText>
```

The changes:
1. Added `Pressable` from react-native
2. Added `pressableStyle` prop to customize press state
3. Modified the rendering logic to conditionally wrap text with `Pressable` when `onPress` exists
4. Used the pressed state from Pressable to apply `pressableStyle` when text is being pressed

This gives you full control over the press state styling without the default React Native text behavior.

---



---

