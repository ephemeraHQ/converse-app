## SpecStory

## Combining buildNumber and version in Expo (1/30/2025, 2:16:05 PM)

_**User**_

is there a way with expo to have runtimeVersion be combinaion of buildNumber and version

---

_**Assistant**_

Yes, you can combine the version and build number for the runtimeVersion in Expo. You'll need to add a build number to your configuration and then combine it with the version. Here's how to modify the code:

```typescript:app.config.ts
// ... existing code ...
    version: version,
    assetBundlePatterns: ["**/*"],
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    runtimeVersion: {
      policy: "sdkVersion"
    },
    // Or if you want to use a custom version string:
    // runtimeVersion: `${version}-${process.env.BUILD_NUMBER || '0'}`,
// ... existing code ...
```

You have two main options:

1. Use the `policy: "sdkVersion"` approach (shown above) which automatically handles versioning based on your Expo SDK version.

2. Create a custom version string by combining version and build number (commented option above). For this approach, you would need to:
   - Set the BUILD_NUMBER environment variable in your build process
   - Or maintain a build number in your package.json
   - Or use a build system that can inject the build number

The second approach gives you more control but requires more setup. The first approach is simpler and is often sufficient for most use cases.

Note: Make sure to update your EAS build configuration to handle the runtime version approach you choose.

---

_**User**_

how can i access the build number if i use autoIncrement with my eas build?

---

_**Assistant**_

You can access the build number from EAS's auto-increment feature by using the `EXPO_PUBLIC_EAS_BUILD_NUMBER` environment variable that EAS automatically provides during builds. Here's how to modify the config:

```typescript:app.config.ts
// ... existing code ...
    version: version,
    assetBundlePatterns: ["**/*"],
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    runtimeVersion: `${version}+${process.env.EXPO_PUBLIC_EAS_BUILD_NUMBER || '0'}`,
// ... existing code ...
```

This will combine your semantic version (e.g., "1.2.3") with the auto-incremented build number (e.g., "5") to create a runtime version like "1.2.3+5".

Note: 
- The build number will be '0' during local development since `EXPO_PUBLIC_EAS_BUILD_NUMBER` is only available during EAS builds
- Make sure you have `autoIncrement: true` set in your eas.json for the platforms you want to auto-increment

For reference, in your eas.json it should look something like this:
```json
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": true
      }
    }
  }
}
```

---



---

