## SpecStory

## EAS CLI Command Usage Clarification (1/19/2025, 11:10:40 AM)

_**User**_

should i use "eas" like this or like "npx eas-cli" ?

---

_**Assistant**_

For EAS (Expo Application Services) commands, it's recommended to use `npx eas-cli` if you don't have EAS CLI installed globally. Using `npx` ensures you're always using the latest version of the CLI and avoids potential global installation issues.

Here's how I would update the script:

```json:package.json
// ... existing code ...
    "android:build:dev": "npx eas-cli build -p android --profile development --local",
// ... existing code ...
```

The `npx` approach is generally safer because:
1. It ensures you're using the correct version of EAS CLI
2. You don't need to install EAS CLI globally
3. It prevents version conflicts between different projects

However, if you have `eas-cli` installed as a project dependency (which I don't see in your package.json), then the current `eas` command would work fine. If you want to be explicit and ensure consistency, using `npx eas-cli` is the safer choice.

---

_**User**_

how can i make sure to use the version installed in the repo?

---

_**Assistant**_

To use the version of EAS CLI installed in your project's dependencies, you should first add it as a dependency and then use `yarn` to execute it. Here's how to do it:

1. First, add `eas-cli` to your devDependencies:

```json:package.json
// ... existing code ...
  "devDependencies": {
    "eas-cli": "^7.7.1",  // Add this line
    // ... existing devDependencies ...
  }
```

2. Then update your script to use `yarn`:

```json:package.json
// ... existing code ...
    "android:build:dev": "yarn eas build -p android --profile development --local",
// ... existing code ...
```

Using `yarn` in the script will automatically use the version installed in your node_modules, ensuring version consistency across your team. This is better than using `npx` when you want to control the exact version being used.

Remember to run `yarn install` after adding the new dependency.

---



---

