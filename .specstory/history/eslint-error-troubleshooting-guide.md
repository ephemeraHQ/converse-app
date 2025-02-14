## SpecStory

## ESLint Error Troubleshooting Guide (11/6/2024, 2:35:40 PM)

_**User**_

what is this error while doing yarn lint

ESLint: 9.14.0

TypeError: context.getScope is not a function
Occurred while linting /Users/thierryskoda/Programming/converse-app/App.tsx:98
Rule: "react-hooks/exhaustive-deps"
    at visitCallExpression (/Users/thierryskoda/Programming/converse-app/node_modules/eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js:1780:34)
    at ruleErrorHandler (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1084:48)
    at /Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/safe-emitter.js:45:58
    at Array.forEach (<anonymous>)
    at Object.emit (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/safe-emitter.js:45:38)
    at NodeEventGenerator.applySelector (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/node-event-generator.js:297:26)
    at NodeEventGenerator.applySelectors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/node-event-generator.js:326:22)
    at NodeEventGenerator.enterNode (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/node-event-generator.js:337:14)
    at runRules (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1128:40)
    at #flatVerifyWithoutProcessors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1911:31)

Oops! Something went wrong! :(

ESLint: 9.14.0

AbortError: The operation was aborted
    at checkAborted (node:internal/fs/promises:472:11)
    at Object.readFile (node:internal/fs/promises:1240:3)
    at retrier.retry.signal (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/eslint/eslint.js:803:47)
    at #call (/Users/thierryskoda/Programming/converse-app/node_modules/@humanwhocodes/retry/dist/retrier.cjs:298:22)
    at /Users/thierryskoda/Programming/converse-app/node_modules/@humanwhocodes/retry/dist/retrier.cjs:360:44
    at #processPending (/Users/thierryskoda/Programming/converse-app/node_modules/@humanwhocodes/retry/dist/retrier.cjs:399:19)
    at /Users/thierryskoda/Programming/converse-app/node_modules/@humanwhocodes/retry/dist/retrier.cjs:313:33
    at <anonymous>

Oops! Something went wrong! :(

ESLint: 9.14.0

---

_**Assistant**_

This error is occurring because there's an incompatibility between the ESLint version (9.14.0) and the react-hooks plugin. Looking at your package.json, I notice you're using a very recent version of ESLint with an older version of eslint-plugin-react-hooks.

Here's how to fix it:

```json:package.json
// ... existing code ...
"devDependencies": {
  // Change these versions
  "eslint": "^8.56.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  // ... existing code ...
}
// ... existing code ...
```

The issue is that ESLint 9.x is still in beta and has breaking changes that affect how plugins work. You should:

1. Downgrade ESLint to the stable 8.x version
2. Make sure eslint-plugin-react-hooks is on the latest 4.x version

After making these changes:

1. Delete your node_modules folder
2. Delete yarn.lock
3. Run `yarn install`
4. Try `yarn lint` again

This should resolve the "getScope is not a function" error you're seeing.

---



---

