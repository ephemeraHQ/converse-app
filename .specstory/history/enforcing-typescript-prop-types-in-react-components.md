## SpecStory

## Enforcing TypeScript Prop Types in React Components (11/6/2024, 12:59:16 PM)

_**User**_

what eslint rule can I add to make sure that someone in React for a component always does create the typing of the props like:
type MyProps ={...}
const MyComponent = (props: MyProps) => {
 const {...}= props
}

---

_**Assistant**_

I'll help you add ESLint rules to enforce proper TypeScript prop typing in React components. Here are the relevant rules to add:

```javascript:.eslintrc.js
module.exports = {
  // ... existing config ...
  rules: {
    // ... existing rules ...

    // --- TypeScript React Props Rules ---
    "@typescript-eslint/explicit-module-boundary-types": "error", // Enforces explicit return types on exported functions and classes
    "@typescript-eslint/no-empty-interface": "error", // Disallows empty interfaces
    "@typescript-eslint/consistent-type-definitions": ["error", "type"], // Enforces using 'type' over 'interface'
    "react/prop-types": "off", // Disable JS prop-types since we're using TypeScript
    "react/require-default-props": "error", // Requires default props to be defined
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "typeAlias",
        "format": ["PascalCase"],
        "prefix": ["I"]
      }
    ],
  }
  // ... rest of config ...
};
```

These rules will help enforce:
1. All exported components must have explicit type annotations
2. Props must be defined using `type` instead of `interface`
3. Type names must start with "I" and use PascalCase
4. Default props must be defined for optional properties
5. Traditional PropTypes are disabled in favor of TypeScript types

With these rules, ESLint will warn if someone tries to create a component without properly typing the props or if they don't destructure props in the function parameters.

Note that you might also want to consider adding the `typescript-sort-keys` plugin if you want to enforce alphabetical ordering of prop types, but that's optional and depends on your team's preferences.

---

_**User**_

other

---

_**Assistant**_

Here are additional ESLint rules that can help enforce good TypeScript and React component practices:

```javascript:.eslintrc.js
// ... existing config ...
rules: {
  // ... existing rules ...

  // --- Component Props Rules ---
  "@typescript-eslint/typedef": [
    "error",
    {
      "parameter": true,
      "propertyDeclaration": true
    }
  ],
  "react/function-component-definition": [
    "error",
    {
      "namedComponents": "function-declaration",
      "unnamedComponents": "arrow-function"
    }
  ],
  "react/destructuring-assignment": ["error", "always"],
  "@typescript-eslint/member-delimiter-style": [
    "error",
    {
      "multiline": {
        "delimiter": "none",
        "requireLast": false
      },
      "singleline": {
        "delimiter": "semi",
        "requireLast": false
      }
    }
  ]
}
```

These rules will enforce:
1. `typedef`: Requires type annotations for function parameters and property declarations
2. `function-component-definition`: Forces using the `function` keyword for named components
3. `destructuring-assignment`: Requires props to be destructured
4. `member-delimiter-style`: Enforces consistent delimiter style in type definitions (no semicolons in multiline)

This will help ensure components are written like:

```typescript
type IMyComponentProps = {
  name: string
  age: number
}

function MyComponent(props: IMyComponentProps) {
  const { name, age } = props
  return <View>...</View>
}
```

And will error on patterns like:

```typescript
// ❌ Will error:
const MyComponent = ({ name, age }) => {...}
// or
const MyComponent = (props) => {...}
// or
const MyComponent = ({ name, age }: any) => {...}
```

---



---

