## SpecStory

## Importance of Splash Screen Configuration (1/19/2025, 9:36:22 AM)

_**User**_

do i need this? we have already some config in the object

---

_**Assistant**_

Looking at your app.config.ts file, I notice you have the splash screen configuration in the `plugins` array. This configuration is actually necessary and different from any other splash screen related settings you might have in the base config object.

The `expo-splash-screen` plugin specifically handles:
1. Native splash screen configuration
2. Dark/light mode variants of the splash screen
3. Precise control over the splash screen image size and background colors

Even if you have splash screen related settings in the base ExpoConfig object, this plugin configuration is important because:
1. It enables proper dark mode support for the splash screen
2. It provides more granular control over the splash screen appearance
3. It handles the native implementation details for both iOS and Android

So yes, you should keep this configuration. It's working together with, not duplicating, other splash screen related settings in your app config.

If you want to remove it, you'd lose the ability to:
- Show different splash screens for dark/light modes
- Control the exact image width
- Have proper native splash screen handling on both platforms

---



---

