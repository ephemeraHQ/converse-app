## SpecStory

## Configuring Source Maps in Metro (1/22/2025, 5:02:12 PM)

_**User**_

where to put sourcemap true in here

---

_**Assistant**_

I'll help you add the sourcemap configuration to enable source maps in your Metro config. This should be added in the transformer options. Here's the modified code:

```javascript:metro.config.js
// ... existing code ...
const converseMetroConfig = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
      sourceMaps: true  // Enable source maps
    }),
    minifierPath: "metro-minify-terser",
    minifierConfig: {
      // Terser options...
    },
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  // ... existing code ...
};
```

I've added `sourceMaps: true` within the `getTransformOptions` async function return object. This will enable source map generation during the Metro bundling process, which is useful for debugging and error tracking as it helps map the bundled code back to the original source code.

---



---

