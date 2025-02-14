## SpecStory

## ESLint TypeError with React Native Plugin (11/6/2024, 2:26:36 PM)

_**User**_


Oops! Something went wrong! :(

ESLint: 9.14.0

TypeError: context.getScope is not a function
Occurred while linting /Users/thierryskoda/Programming/converse-app/utils/debug.ts:9
Rule: "react-native/no-inline-styles"
    at Object.getParentES6Component (/Users/thierryskoda/Programming/converse-app/node_modules/eslint-plugin-react-native/lib/util/Components.js:200:27)
    at Object.getParentComponent (/Users/thierryskoda/Programming/converse-app/node_modules/eslint-plugin-react-native/lib/util/Components.js:170:15)
    at Object.ArrowFunctionExpression (/Users/thierryskoda/Programming/converse-app/node_modules/eslint-plugin-react-native/lib/util/Components.js:358:26)
    at updatedRuleInstructions.<computed> (/Users/thierryskoda/Programming/converse-app/node_modules/eslint-plugin-react-native/lib/util/Components.js:395:41)
    at ruleErrorHandler (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1084:48)
    at /Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/safe-emitter.js:45:58
    at Array.forEach (<anonymous>)
    at Object.emit (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/safe-emitter.js:45:38)
    at NodeEventGenerator.applySelector (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/node-event-generator.js:297:26)
    at NodeEventGenerator.applySelectors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/node-event-generator.js:326:22)

---

_**Assistant**_

It looks like you're encountering an error with ESLint's flat config format and the react-native plugin. The error occurs because the react-native plugin hasn't been updated to support ESLint's new flat config system. Let's modify the config to work around this issue.

Here's the necessary change:

```javascript:eslint.config.mjs
// ... imports remain the same ...

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    // ... other config remains the same ...
    
    rules: {
      // ... other rules remain the same ...

      // Remove or comment out these react-native rules temporarily
      // "react-native/no-inline-styles": "warn",
      // "react-native/no-raw-text": "error",

      // ... rest of the rules remain the same ...
    },
    // ... rest of the config remains the same ...
  },
];
```

The issue is that `eslint-plugin-react-native` is not yet compatible with ESLint's new flat config system. Until the plugin is updated, you have two options:

1. Comment out the react-native rules as shown above
2. Consider switching back to the older `.eslintrc` format if the react-native rules are critical for your project

If you want to keep using the flat config, you'll need to wait for the react-native plugin to be updated to support the new format, or create your own custom rules to handle these checks.

---



---

