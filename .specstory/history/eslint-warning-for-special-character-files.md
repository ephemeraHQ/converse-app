## SpecStory

## ESLint Warning for Special Character Files (11/6/2024, 2:12:17 PM)

_**User**_

why I get "  0:0  warning  File ignored because no matching configuration was supplied" in a file like @debug.ts 

---

_**Assistant**_

This warning typically appears when ESLint can't find a matching configuration for your file, often due to the `@` symbol in the filename. The issue is likely because the `ignorePatterns` in your ESLint config isn't properly configured to handle files with special characters.

Here's how to fix it in your ESLint config:

```javascript:eslint.config.js
// ... existing code ...
  ignorePatterns: [
    "dist/", 
    "node_modules/", 
    "vendor/",
    "!utils/@*.ts"  // Add this line to explicitly include @ files
  ],
// ... existing code ...
```

Alternatively, you could also rename your file from `@debug.ts` to `debug.ts` to follow more conventional naming patterns. This would be my recommended approach since:

1. The `@` prefix isn't a common TypeScript/JavaScript naming convention
2. It can cause issues with various tools and build systems
3. It makes the codebase more consistent and easier to maintain

If you decide to keep the `@` prefix, make sure to also update any imports in your codebase from:
```typescript
import { debugTimeSpent } from '@debug'
```
to:
```typescript
import { debugTimeSpent } from './debug'
```

---



---

