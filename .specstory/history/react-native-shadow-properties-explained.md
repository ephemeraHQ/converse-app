## SpecStory

## React Native Shadow Properties Explained (11/4/2024, 11:38:39 AM)

_**User**_

what is the reac-tnative shadow property for blurSize

---

_**Assistant**_

React Native doesn't have a `blurSize` property for shadows. On iOS, shadow properties are controlled through:
- `shadowOffset`
- `shadowOpacity`
- `shadowRadius` (this controls the blur/spread of the shadow)
- `shadowColor`

For Android, shadows are handled differently using:
- `elevation` (a single number value that controls the shadow)

Here's how I would update your shadow.ts file to work well across both platforms:

```typescript:theme/shadow.ts
import { Platform } from 'react-native';
import { darkPalette, lightPalette } from "@theme/palette";

export const shadow = {
  big: {
    // iOS shadow properties
    shadowColor: darkPalette.alpha15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    // Android shadow property
    elevation: 8,
  },
} as const;
```

The `elevation` value doesn't map 1:1 with iOS shadow properties, so you might need to adjust it to match your iOS shadow appearance as closely as possible. Generally, a good rule of thumb is to set `elevation` to about half of your `shadowRadius` value.

---

_**User**_

what about the spread

---

_**Assistant**_

In React Native, there isn't a direct equivalent to CSS's `spread` property for shadows. The shadow behavior is somewhat limited compared to web CSS:

1. On iOS, `shadowRadius` controls both the blur and spread together - you can't control them separately
2. On Android, `elevation` is just a single number that controls the entire shadow effect

If you need more complex shadow effects like spread, you'll need to use alternative approaches:

1. Use multiple nested views with different shadows
2. Use a PNG image with the shadow pre-rendered
3. Use a third-party library like `react-native-shadow-2`

Here's how you might use `react-native-shadow-2` to get more control over shadows:

```typescript:theme/shadow.ts
import { Platform } from 'react-native';
import { darkPalette, lightPalette } from "@theme/palette";

export const shadow = {
  big: Platform.select({
    ios: {
      shadowColor: darkPalette.alpha15,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
  // If using react-native-shadow-2
  bigWithSpread: {
    distance: 4,
    startColor: darkPalette.alpha15,
    offset: [0, 4],
    spread: 16,
    blur: 16,
  },
} as const;
```

If you want to use `react-native-shadow-2`, you would need to wrap your component with the `Shadow` component from the library:

```tsx
import { Shadow } from 'react-native-shadow-2';

<Shadow {...shadow.bigWithSpread}>
  <YourComponent />
</Shadow>
```

But if you don't need precise spread control, I'd recommend sticking with the native shadow implementation for better performance.

---



---

