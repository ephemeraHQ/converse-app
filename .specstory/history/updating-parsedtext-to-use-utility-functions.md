## SpecStory

## Updating ParsedText to Use Utility Functions (11/14/2024, 10:34:06 AM)

_**User**_

fix to use what's in @ParsedText.utils.ts 

---

_**Assistant**_

I'll help you modify the `ParsedText.tsx` to use the utility functions from `ParsedText.utils.ts`. Here's how to update the relevant section:

```typescript:components/ParsedText/ParsedText.tsx
// ... existing code ...

// Import the utility function
import { parseText } from "./ParsedText.utils";

export const ParsedText = forwardRef<Text, ParsedTextProps>((props, ref) => {
  // ... existing code ...

  const getParsedText = (): ReactNode => {
    if (!parse) {
      return props.children;
    }
    if (typeof props.children !== "string") {
      return props.children;
    }

    const patterns = getPatterns();
    const parsedParts = parseText({ text: props.children, patterns });

    return parsedParts.map((parsedProps, index) => {
      const { style: parentStyle } = props;
      const { style, children, _matched, ...remainderParsed } = parsedProps;

      return (
        <Text
          key={`parsedText-${index}`}
          style={[parentStyle, style]}
          {...childrenProps}
          {...(remainderParsed as TextProps)}
        >
          {children}
        </Text>
      );
    });
  };

  // ... existing code ...
});
```

Key changes made:
1. Imported the `parseText` utility function
2. Replaced `TextExtraction` usage with `parseText`
3. Destructured `_matched` from parsedProps since it's an internal property we don't want to pass to the Text component
4. The rest of the component remains the same

This change makes the code more maintainable by using the utility function and removes the need for the `TextExtraction` class.

---



---

