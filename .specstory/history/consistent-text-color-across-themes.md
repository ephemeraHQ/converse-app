## SpecStory

## Consistent Text Color Across Themes (1/10/2025, 9:15:04 AM)

_**User**_

ok help me think this throguhg. I have @colorsLight.ts and @colorsDark.ts depening on the device appaerace chocie. But for a component where I render text in it, I always want the text to be white. I usually use text.primary because that's the main color but problem is when i go dark it shows white since primary in dark is white but in light it shows like black but I want white

---

_**Assistant**_

I understand the issue. You want consistent white text regardless of the theme. There are a few approaches we can take:

1. **Best Solution**: Add a new color token specifically for this use case in both theme files. This is the most maintainable solution if you have multiple components that need this behavior.

2. **Quick Solution**: Directly use `lightPalette.light` since that's white in both themes.

Let's implement the best solution. Here are the changes needed:

```typescript:theme/colorsLight.ts
export const colorsLight = {
  text: {
    // ... existing text colors ...
    primary: darkPalette.dark,
    // Add this new token
    static: {
      white: lightPalette.light,
      black: darkPalette.dark,
    },
    // ... rest of the colors
  },
  // ... rest of the theme
} as const;
```

```typescript:theme/colorsDark.ts
export const colorsDark = {
  text: {
    // ... existing text colors ...
    primary: lightPalette.light,
    // Add the same token
    static: {
      white: lightPalette.light,
      black: darkPalette.dark,
    },
    // ... rest of the colors
  },
  // ... rest of the theme
} as const;
```

Then in your Avatar component, update the text color:

```typescript:components/Avatar.tsx
// ... existing code ...
        <Text
          weight="medium"
          color="primary"
          style={{
            color: theme.colors.text.static.white, // Use the new static white color
            fontSize: avatarSize / 2.4,
            lineHeight: avatarSize / 2.4,
          }}
        >
// ... rest of the code
```

This approach has several benefits:
1. It's semantically clear what the color will be
2. It's consistent across themes
3. If you need to change the white color in the future, you can do it in one place
4. TypeScript will help ensure the color token exists

The alternative quick solution would be to directly use `lightPalette.light`, but that would couple your component to the palette implementation details, which is less maintainable long-term.

---



---

