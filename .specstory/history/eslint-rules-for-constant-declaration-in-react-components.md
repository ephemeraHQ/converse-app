## SpecStory

## ESLint Rules for Constant Declaration in React Components (11/6/2024, 12:50:37 PM)

_**User**_

check @.eslintrc.js and tell me what esling rules can I have to make sure that all constants are not inside react-component like this. Like they should be at the root

---

_**Assistant**_

I'll help you create an ESLint rule to enforce constants being declared at the root level instead of inside components. Here's how we can modify your `.eslintrc.js`:

```javascript:.eslintrc.js
// ... existing code ...
  rules: {
    // ... other rules ...

    // Add this new rule
    "no-component-constants": {
      create(context) {
        return {
          FunctionDeclaration(node) {
            // Check if this is a React component (starts with capital letter)
            if (!/^[A-Z]/.test(node.id.name)) return;

            // Look for const declarations inside the component
            const constDeclarations = node.body.body.filter(
              statement =>
                statement.type === 'VariableDeclaration' &&
                statement.kind === 'const' &&
                statement.declarations.some(decl => 
                  // Only flag constants that are primitive values or simple objects
                  decl.init && (
                    decl.init.type === 'Literal' ||
                    decl.init.type === 'ObjectExpression' ||
                    decl.init.type === 'ArrayExpression'
                  )
                )
            );

            constDeclarations.forEach(declaration => {
              context.report({
                node: declaration,
                message: 'Constants should be declared at the root level, not inside components.',
                fix(fixer) {
                  // Move the constant to the top of the file
                  return fixer.move(declaration, context.getSourceCode().ast.body[0]);
                }
              });
            });
          },
          // Also check arrow function components
          ArrowFunctionExpression(node) {
            if (!node.parent?.id?.name?.match(/^[A-Z]/)) return;
            
            // Similar logic as above for arrow functions
            // ... 
          }
        };
      }
    }
  }
```

This rule will:
1. Detect React components (functions starting with capital letters)
2. Find constant declarations inside them
3. Report an error if the constant appears to be a simple value that could be moved to the root
4. Optionally provide an auto-fix to move the constant to the file root

For your specific case with `DEFAULT_INPUT_HEIGHT`, you would get an error suggesting to move it outside the component. The correct way would be:

```typescript:components/Chat/Chat.tsx
const DEFAULT_INPUT_HEIGHT = 58;

export function Chat() {
  // ... rest of the component
}
```

Note that this rule is somewhat opinionated and you might want to tune it based on your specific needs. For example, you might want to:
1. Add exceptions for certain constant names
2. Only check numeric/string constants
3. Allow constants that depend on props or other component state
4. Add specific naming conventions for root-level constants (like SCREAMING_SNAKE_CASE)

Let me know if you'd like me to modify the rule with any of these additional features!

---

_**User**_

I need a custom rules ? There are no existing rules ic an reuse?

---

_**Assistant**_

Yes, there are existing ESLint rules you can use! Here's how you can modify your `.eslintrc.js` to enforce this pattern using built-in rules:

```javascript:.eslintrc.js
module.exports = {
  // ... rest of your config ...
  rules: {
    // ... other rules ...
    
    // This will prevent declaring variables inside components
    "no-inner-declarations": ["error", "both"],
    
    // This ensures constants follow naming convention
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "modifiers": ["const", "global"],
        "format": ["UPPER_CASE"],
        "types": ["boolean", "string", "number"]
      }
    ],

    // Forces declarations to the top of file/function
    "vars-on-top": "error",
  }
}
```

This combination of rules will:
1. Prevent declaring variables inside nested blocks/functions
2. Enforce UPPER_CASE naming for global constants
3. Force variable declarations to the top

You might need to install `@typescript-eslint/eslint-plugin` if you haven't already:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin
```

This is a more maintainable approach than creating a custom rule since these are well-tested, documented rules that are part of the ESLint ecosystem.

---



---

