## SpecStory

## Expo Plugins Configuration Format (2/6/2025, 7:02:52 PM)

_**User**_

is it okat this format? for expo plugins?

---

_**Assistant**_

Yes, that format is correct for Expo plugins in the app.config.ts file. The plugins array accepts entries in two formats:

1. Simple format (what you're using):
```typescript
["plugin-name", optionalConfigObject]
```

2. Extended format:
```typescript
{
  plugin: ["plugin-name", optionalConfigObject]
}
```

Your current format is the standard and recommended way to specify Expo plugins. Each plugin is defined as an array where:
- First element is the plugin name (string)
- Second element is the configuration object (can be empty `{}` if no config is needed)

For example, your plugins are correctly configured:
```typescript
plugins: [
  ["expo-notifications", {}],  // No special config needed
  ["expo-secure-store", {}],   // No special config needed
  ["expo-apple-authentication", {}],  // No special config needed
  ["expo-local-authentication", {
    faceIDPermission: "We need this to use biometrics to secure your data."
  }],  // With specific config
]
```

This is the idiomatic way to configure Expo plugins in your app.config.ts file.

---



---

