## SpecStory

## Difference Between Expo Splash Screen Configurations (2/6/2025, 11:22:31 AM)

_**User**_

what is idffernet between have expo-splash-screen and config in plugins or having it like:

splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    }, ??

---

_**Assistant**_

The main difference lies in how the splash screen is configured and handled:

1. **Using `expo-splash-screen` plugin:**
```typescript:app.config.ts
plugins: [
  [
    "expo-splash-screen",
    {
      image: "./assets/splash.png",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/splash-dark.png",
        backgroundColor: "#000000",
      },
      imageWidth: 300,
    },
  ],
  // ... other plugins
]
```
- Provides more advanced features like dark mode support
- Allows for more configuration options (like `imageWidth`)
- Better native integration and performance
- Recommended for newer Expo SDK versions
- Handles the splash screen as a native module

2. **Using `splash` config:**
```typescript
splash: {
  image: "./assets/images/splash.png",
  resizeMode: "contain",
  backgroundColor: "#000000",
}
```
- More basic configuration
- Legacy approach used in older Expo versions
- Limited configuration options
- Doesn't support dark mode
- Handles splash screen through Expo's basic configuration

The plugin approach (`expo-splash-screen`) is the recommended modern way to handle splash screens in Expo applications, as it provides more features and better native integration. The `splash` config is considered legacy and might be deprecated in future versions.

---



---

