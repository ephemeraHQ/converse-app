## SpecStory

## Resolving ESLint Import Errors in Yarn (11/7/2024, 7:34:28 AM)

_**User**_

why when i do yarn lint i get so many errors like this: "Unable to resolve path to module './evm/address'                       import/no-unresolved"

---

_**Assistant**_

This error occurs because ESLint's `import/no-unresolved` rule can't find your modules. This is common when using TypeScript with module aliases or when ESLint doesn't know about your module resolution configuration.

Here's how to fix it. Add these changes to your ESLint config:

```mjs:eslint.config.mjs
// ... existing imports ...

export default [
  {
    files: ["**/*.{ts,tsx}"],
    // ... other existing config ...
    
    settings: {
      react: {
        version: "detect",
      },
      // Add these settings for import resolution
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"]
        }
      }
    },
    
    rules: {
      // ... existing rules ...
      
      // Either disable the rule completely
      "import/no-unresolved": "off",
      
      // OR keep it but configure it to understand TypeScript
      "import/no-unresolved": [
        2,
        {
          ignore: ["\\.js$"] // Ignore .js extensions for TypeScript files
        }
      ]
    }
  },
  // ... rest of config ...
];
```

You have two options:

1. The simplest solution is to disable the rule by setting `"import/no-unresolved": "off"`

2. The more complete solution is to:
   - Install `eslint-import-resolver-typescript` with: `yarn add -D eslint-import-resolver-typescript`
   - Add the settings block shown above to configure the import resolver

The second approach is better if you want to keep the benefits of ESLint checking your imports, but it requires additional setup. Choose based on your needs!

---

_**User**_

which plugin brings this eslint rules?

---

_**Assistant**_

The `import/no-unresolved` rule comes from the `eslint-plugin-import` plugin, which you already have imported in your config as `pluginImport`.

Here's the relevant line in your config:

```mjs:eslint.config.mjs
import pluginImport from "eslint-plugin-import";
```

And you're applying its rules here:
```mjs:eslint.config.mjs
rules: {
  ...pluginImport.configs["recommended"].rules,
  // ...
}
```

To fix this properly, you'll need to:

1. Install the TypeScript resolver:
```bash
yarn add -D eslint-import-resolver-typescript
```

2. Or if you want to simply disable these import-related checks, you can modify the rules to turn off all `import/*` rules:
```mjs:eslint.config.mjs
rules: {
  // ... existing rules ...
  "import/no-unresolved": "off",
  "import/named": "off",
  "import/namespace": "off",
  "import/default": "off",
  "import/export": "off",
}
```

The choice depends on whether you want ESLint to help you catch import errors (in which case use the resolver) or if you prefer to rely on TypeScript for this (in which case disable the rules).

---



---

