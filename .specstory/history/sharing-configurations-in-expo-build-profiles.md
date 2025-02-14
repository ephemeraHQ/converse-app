## SpecStory

## Sharing Configurations in Expo Build Profiles (1/23/2025, 4:11:57 PM)

_**User**_

read about expo doc can we share stuff accross diff profiles

---

_**Assistant**_

Based on the Expo documentation, you can share common configuration across different build profiles using EAS Build Profiles. Here's how you can refactor your `eas.json` to reduce duplication:

```json:eas.json
{
  "cli": {
    "version": ">=12.6.0",
    "appVersionSource": "remote"
  },
  "build": {
    "base": {
      "autoIncrement": true,
      "node": "20.18.0",
      "ios": {
        "cocoapods": "1.16.2",
        "image": "macos-sonoma-14.6-xcode-16.1"
      },
      "android": {
        "resourceClass": "large"
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "environment": "development"
    },
    "preview": {
      "extends": "base",
      "channel": "preview",
      "environment": "preview"
    },
    "production": {
      "extends": "base",
      "channel": "production",
      "environment": "production",
      "android": {
        "buildType": "app-bundle",
        "resourceClass": "large"
      }
    }
  },
  // ... existing submit config ...
}
```

The key changes are:
1. Created a `base` profile that contains all the common configuration
2. Added `extends": "base"` to each profile to inherit from the base configuration
3. Each profile now only contains its unique configurations
4. For production, we keep the android-specific override for `buildType` while still inheriting other base configs

This approach makes the configuration more maintainable since common values only need to be updated in one place. The `extends` feature allows you to inherit all properties from another profile while still being able to override specific values when needed.

---



---

