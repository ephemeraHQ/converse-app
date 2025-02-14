## SpecStory

## Do I need react-native-svg-transformer in Expo SDK 52? (1/19/2025, 7:17:46 AM)

_**User**_

do you know if i really need this in my expo sdk 52 project? "react-native-svg-transformer"

---

_**Assistant**_

Let me help explain the `react-native-svg-transformer` usage in Expo SDK 52:

1. `react-native-svg-transformer` is **not strictly required** in Expo SDK 52 projects. It's a utility that allows you to import SVG files directly as React components, like this:
```typescript
import Logo from './logo.svg';
// Use as: <Logo width={100} height={100} />
```

2. Without this transformer, you have two alternative approaches for handling SVGs in Expo:

   a. Use `react-native-svg` directly (which is included in Expo SDK) to create SVG components manually:
   ```typescript
   import { Svg, Path } from 'react-native-svg';
   
   function Logo() {
     return (
       <Svg width={100} height={100}>
         <Path d="..." fill="black" />
       </Svg>
     );
   }
   ```

   b. Convert SVGs to React Native components using online tools or design tools, then copy the generated component code into your project.

If you're not importing SVG files directly as components, you can safely remove the SVG transformer configuration from your metro config. Here's how to update your config:

```javascript:metro.config.js
// ... existing code ...
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        // Maybe enable this later https://docs.expo.dev/guides/tree-shaking/
        // experimentalImportSupport: true,
        // inlineRequires: true,
      },
    }),
    // Remove this line if you're not using SVG imports
    // babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts, // Remove the SVG filter
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      // Remove "svg" if you're not using SVG imports
      "mjs", // Support .mjs files (required for Expo 49 compatibility)
    ],
// ... existing code ...
```

The choice depends on how you prefer to handle SVGs in your project. If you're manually creating SVG components or using pre-converted components, you can remove the transformer. If you want the convenience of importing SVG files directly as components, keep the transformer configuration.

---



---

