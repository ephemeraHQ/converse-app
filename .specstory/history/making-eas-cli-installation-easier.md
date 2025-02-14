## SpecStory

## Making EAS CLI Installation Easier (1/27/2025, 11:49:08 AM)

_**User**_

People having problems running commands like "android:build:dev" because they don't have "eas" installed... how can i make it easier for them?  

---

_**Assistant**_

I can help you add a check for `eas-cli` and provide instructions in the error message. Let's modify the script to make it more user-friendly.

```json:package.json
// ... existing code ...
  "scripts": {
    "preandroid:build:dev": "command -v eas >/dev/null 2>&1 || { echo \" Error: 'eas' command not found.\n Please install EAS CLI first by running:\n npm install -g eas-cli\"; exit 1; }",
    "android:build:dev": "eas build -p android --profile development --local",
// ... existing code ...
```

This adds a `preandroid:build:dev` script that will run automatically before `android:build:dev`. It:
1. Checks if the `eas` command exists
2. If not found, displays a helpful error message with installation instructions
3. Exits with an error code to prevent the main script from running

You might also want to add a note about this requirement in your project's README.md file to make it more visible to developers when they first clone the repository.

---

_**User**_

But  oculd i install eas-lci in dev deps? Or it won't change anytihng... what about using npx eas?

---

_**Assistant**_

Yes, using `npx eas` is a better solution! This way developers don't need to install `eas-cli` globally, and it will automatically use the version specified in your dependencies if installed, or download it temporarily if not.

Here's how to modify the script:

```json:package.json
// ... existing code ...
  "scripts": {
    "android:build:dev": "npx eas build -p android --profile development --local",
// ... existing code ...
  },
  "devDependencies": {
    "eas-cli": "^7.7.1",
    // ... existing dev dependencies ...
  }
```

This approach has several benefits:
1. No need for global installation
2. Version is locked in package.json
3. Works out of the box after `yarn install`
4. Even if someone forgets to install dependencies, `npx` will handle it gracefully

I recommend adding `eas-cli` to devDependencies as shown above, as it ensures everyone uses the same version and it gets installed with other dev tools during setup.

---



---

