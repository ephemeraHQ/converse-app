## SpecStory

## Renaming EAS Build Configuration (1/24/2025, 10:52:36 AM)

_**User**_

i don't like having base because it thinks it's a build profile but it's not...

---

_**Assistant**_

I understand you want to rename/restructure the base configuration since it's not actually a build profile but rather a shared configuration. In EAS Build, we can use a special key called `_internal` for shared configurations that shouldn't be treated as build profiles.

Here's how we can modify the file:

```json:eas.json
{
  "cli": {
    "version": ">=12.6.0",
    "appVersionSource": "remote"
  },
  "build": {
    "_internal": {
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
      "extends": "_internal",
      // ... existing code ...
    },
    "preview": {
      "extends": "_internal",
      // ... existing code ...
    },
    "production": {
      "extends": "_internal",
      // ... existing code ...
    }
  },
  // ... existing code ...
}
```

The key changes are:
1. Renamed `base` to `_internal` to indicate it's a shared configuration
2. Updated all `extends` references to use `"_internal"` instead of `"base"`

This makes it clearer that this configuration is meant to be shared across profiles but isn't a build profile itself.

---



---

