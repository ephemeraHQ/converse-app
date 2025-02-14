## SpecStory

## Font Weight Limitations in React Native (1/29/2025, 10:33:46 AM)

_**User**_

can react-antive have wieght value of like 590? 

---

_**Assistant**_

No, React Native only supports specific numeric font weight values. The valid font weight values in React Native are: '100', '200', '300', '400', '500', '600', '700', '800', and '900', or their string equivalents like 'normal' (400) and 'bold' (700).

The current values of 710 and 590 won't work correctly across all platforms. Let's adjust these to the closest standard values:

```typescript:design-system/Text/Text.styles.ts
// ... existing code ...
const numericWeights: Record<IWeights, number> = {
  light: 300,
  normal: 400,
  medium: 500,    // Changed from 710 to standard 500
  semiBold: 600,  // Changed from 590 to standard 600
  bold: 700,
};
// ... existing code ...
```

These changes will ensure better cross-platform compatibility. If you need specific visual weights that match the Figma design, you should achieve this through the appropriate font family files rather than non-standard font weight values.

---



---

