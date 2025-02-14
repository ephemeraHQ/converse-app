## SpecStory

## Adding Text Presets to Button Styles (11/4/2024, 3:07:10 PM)

_**User**_

how can i add "textPresets.title" from @Text.presets.ts  to this style

---

_**Assistant**_

I'll help you add the text preset styles to the button text. Based on the size, we'll apply different text presets.

```typescript:design-system/Button/Button.styles.ts
export const getButtonTextStyle =
  ({
    size,
    variant,
    action,
    pressed = false,
    disabled = false,
  }: IButtonStyleProps) =>
  (theme: Theme): TextStyle => {
    const { colors } = theme;

    const style: TextStyle = {
      ...((size === "sm" || size === "md") 
        ? textPresets.body.reduce((acc, style) => ({ ...acc, ...(typeof style === 'function' ? style(theme) : style) }), {})
        : textPresets.title.reduce((acc, style) => ({ ...acc, ...(typeof style === 'function' ? style(theme) : style) }), {})),
      textAlign: "center",
      flexShrink: 1,
      flexGrow: 0,
      zIndex: 2,
    };

    // ... rest of the code stays the same ...
```

The key changes are:
1. Removed the commented out line
2. Added a proper implementation of the text presets that:
   - Uses `body` preset for "sm" and "md" sizes
   - Uses `title` preset for other sizes (like "lg")
   - Properly reduces the style array and handles both static and themed styles

The `.reduce()` is necessary because `textPresets` returns an array of styles that can be either static objects or themed functions. We need to merge them all together while also executing any themed functions with the current theme.

---



---

