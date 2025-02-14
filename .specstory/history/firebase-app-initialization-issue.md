## SpecStory

## Firebase App Initialization Issue (2/6/2025, 10:52:09 AM)

_**User**_

ok look at @app.config.ts  and @appCheck.ts . i still get "No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()".

But IMO I shouldn'T need to call firebase.initlizeApp!!

check the usage here @https://rnfirebase.io/app-check/usage 

---

_**Assistant**_

Looking at the documentation and your code, I see the issue. According to the RN Firebase App Check documentation, you need to initialize the App Check module in your native iOS code before calling `firebase.configure()`. However, in Expo, we need to handle this through the config plugins system.

Let's modify your `app.config.ts` to add the App Check plugin configuration:

```typescript:app.config.ts
// ... existing code ...

return {
  // ... existing config ...
  plugins: [
    // Add this before other Firebase plugins
    ["@react-native-firebase/app-check"],
    // ... your existing plugins ...
    ["@react-native-firebase/app"],
    ["@react-native-firebase/app-check"],
    // ... rest of plugins ...
  ],
  // ... rest of config ...
};
```

The key changes are:

1. Adding the App Check plugin before the Firebase App plugin to ensure proper initialization order
2. Making sure both `@react-native-firebase/app` and `@react-native-firebase/app-check` plugins are included

After making these changes, you'll need to rebuild your app:

```bash
expo prebuild --clean
```

This should properly set up the native initialization of Firebase App Check before Firebase is configured, resolving the initialization error you're seeing.

The documentation shows that for bare React Native projects, this would be done in the `AppDelegate.mm`, but since you're using Expo, the config plugins system handles this native setup for us.

Also, make sure you have the latest versions of the Firebase packages installed in your `package.json`. The error you're seeing sometimes occurs with mismatched or outdated Firebase package versions.

---



---

