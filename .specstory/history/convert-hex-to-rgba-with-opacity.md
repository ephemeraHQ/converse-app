## SpecStory

## Convert HEX to RGBA with Opacity (1/8/2025, 12:36:35 PM)

_**User**_

is htere a function in here where i can pass an HEX colors vlaue and apply some opacity to it? So like convert to RBGA and apply an opacity that I decide

---

_**Assistant**_

Yes! You can combine a few of the existing functions to achieve this. Here's a simple solution that takes a hex color and opacity value:

```typescript
function hexToRGBA(hexColor: string, alpha: number): string {
  'worklet';
  const normalizedColor = normalizeColor(hexColor);
  if (normalizedColor === null) {
    return '';
  }
  
  const r = red(normalizedColor);
  const g = green(normalizedColor);
  const b = blue(normalizedColor);
  
  return rgbaColor(r, g, b, alpha);
}
```

You can use it like this:
```typescript
const color = hexToRGBA('#FF0000', 0.5); // Returns "rgba(255, 0, 0, 0.5)"
```

This function:
1. Takes a hex color string (like '#FF0000') and an opacity value (0-1)
2. Uses `normalizeColor` to parse the hex color
3. Extracts the RGB values using the existing `red()`, `green()`, and `blue()` helper functions
4. Creates an RGBA color string with your desired opacity using the existing `rgbaColor()` function

The function will work with both 3-digit (#RGB) and 6-digit (#RRGGBB) hex colors.

---



---

