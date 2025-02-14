## SpecStory

## Understanding React JSX Scope Error (11/7/2024, 7:37:55 AM)

_**User**_

why I get "'React' must be in scope when using JSX                                                                                                                                                                                      react/react-in-jsx-scope"

---

_**Assistant**_

This error occurs because you need to add a rule to disable the `react/react-in-jsx-scope` check since you're likely using React 17+ where the JSX transform doesn't require importing React explicitly anymore.

Here's how to fix it in your ESLint config:

```javascript:eslint.config.mjs
// ... existing imports and config ...
    rules: {
      ...pluginTypescript.configs["recommended"].rules,
      ...pluginReact.configs["recommended"].rules,
      ...pluginImport.configs["recommended"].rules,
      ...pluginReactHooks.configs["recommended"].rules,
      ...pluginReactNative.configs["all"].rules,

      // Add this rule:
      "react/react-in-jsx-scope": "off",

      // ... rest of your rules ...
    },
```

This rule is no longer needed if you're using React 17 or later because the new JSX transform doesn't require importing React into every file that uses JSX. The transform automatically handles this for you.

If you're using an older version of React (pre-17), you should instead make sure to import React in every JSX file:

```typescript
import React from 'react';
```

---

_**User**_

what rules does the react plugin bring?

---

_**Assistant**_

The React plugin (`eslint-plugin-react`) brings quite a few rules. In your config, you're importing all recommended rules with `...pluginReact.configs["recommended"].rules`. Here are the key rules that come with the recommended configuration:

```javascript
{
  // Core Rules
  "react/display-name": "error",
  "react/jsx-key": "error",
  "react/jsx-no-comment-textnodes": "error",
  "react/jsx-no-duplicate-props": "error",
  "react/jsx-no-target-blank": "error",
  "react/jsx-no-undef": "error",
  "react/jsx-uses-react": "error",
  "react/jsx-uses-vars": "error",
  "react/no-children-prop": "error",
  "react/no-danger-with-children": "error",
  "react/no-deprecated": "error",
  "react/no-direct-mutation-state": "error",
  "react/no-find-dom-node": "error",
  "react/no-is-mounted": "error",
  "react/no-render-return-value": "error",
  "react/no-string-refs": "error",
  "react/no-unescaped-entities": "error",
  "react/no-unknown-property": "error",
  "react/no-unsafe": "off",
  "react/prop-types": "error",
  "react/react-in-jsx-scope": "error",
  "react/require-render-return": "error"
}
```

There are also many other optional rules you can enable. Some useful ones include:

```javascript
{
  // Additional Popular Rules
  "react/jsx-no-bind": "warn",              // Prevents usage of .bind() or arrow functions in JSX props
  "react/jsx-pascal-case": "error",         // Enforces PascalCase for components
  "react/jsx-no-literals": "error",         // Prevents string literals in JSX
  "react/no-unused-prop-types": "warn",     // Prevents unused prop types
  "react/prefer-stateless-function": "warn", // Encourages use of functional components
  "react/self-closing-comp": "error",       // Prevents extra closing tags for components without children
  "react/sort-comp": "error",               // Enforces component method order
  "react/jsx-max-props-per-line": "error",  // Limits number of props on a single line in JSX
  "react/jsx-first-prop-new-line": "error", // Ensures first prop is on a new line when props span multiple lines
  "react/jsx-closing-bracket-location": "error", // Validates closing bracket location in JSX
  "react/jsx-boolean-value": "error",       // Enforces boolean attributes notation in JSX
  "react/no-array-index-key": "warn",       // Prevents usage of Array index in keys
  "react/jsx-wrap-multilines": "error",     // Prevents missing parentheses around multilines JSX
  "react/jsx-fragments": "error",           // Enforces consistent usage of Fragment syntax
}
```

You can view all available rules in the [eslint-plugin-react documentation](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules).

To customize any of these rules in your config, you can override them in your rules section:

```javascript:eslint.config.mjs
rules: {
  ...pluginReact.configs["recommended"].rules,
  // Override specific rules
  "react/jsx-no-bind": ["warn", {
    "allowArrowFunctions": true,
    "allowFunctions": false,
    "allowBind": false
  }],
  "react/jsx-pascal-case": "error",
  // ... other rules
}
```

---



---

