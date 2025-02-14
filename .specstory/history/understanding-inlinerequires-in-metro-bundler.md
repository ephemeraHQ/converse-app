## SpecStory

## Understanding inlineRequires in Metro Bundler (1/19/2025, 7:11:26 AM)

_**User**_

find docs for inlineRequires

---

_**Assistant**_

Let me help explain the `inlineRequires` option in Metro config.

The `inlineRequires` option is a Metro bundler optimization that helps improve the initial load time of your React Native app. Here's how it works:

1. **Without inlineRequires (false):**
   - All `require` statements in a module are executed when the module is loaded, regardless of whether the imported values are actually used.

2. **With inlineRequires (true):**
   - `require` calls are delayed until the imported value is actually used
   - This creates a form of "lazy loading" at the module level
   - Particularly beneficial for large modules that may only use a small portion of their imports

Official documentation reference:
- [Metro Documentation - inlineRequires](https://facebook.github.io/metro/docs/configuration#transformer-options)
- [React Native Performance - Enable RAM Format](https://reactnative.dev/docs/ram-bundles-inline-requires#enable-inline-requires)

Your current configuration has it correctly enabled:

```javascript:metro.config.js
// ... existing code ...
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Optimize module loading performance
      },
    }),
// ... existing code ...
```

This is generally recommended for production builds as it can significantly improve startup time, especially for larger apps. The performance benefit comes from reducing the amount of JavaScript that needs to be parsed and executed during the initial app load.

---



---

