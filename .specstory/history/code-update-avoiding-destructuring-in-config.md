## SpecStory

## Code Update: Avoiding Destructuring in Config (1/19/2025, 9:03:05 AM)

_**User**_

don't deconsutrct like this ""

---

_**Assistant**_

I'll help you update the code to avoid destructuring the config object directly. Based on the style guide, we should use the config object directly when accessing its properties. Here's the change:

```typescript:app.config.ts
// ... existing code ...
const env = isDev ? "dev" : isPreview ? "preview" : "prod";
const config = settings[env];

// Remove destructuring and use config object directly in the export
export default ({ config: expoConfig }: ConfigContext): ExpoConfig => ({
  ...expoConfig,
  name: isDev ? "Converse DEV" : isPreview ? "Converse PREVIEW" : "Converse",
  scheme: config.scheme,
  slug: "converse",
  orientation: "portrait",
  icon: isProduction ? "./assets/icon.png" : "./assets/icon-preview.png",
  // ... existing code ...
  android: {
    versionCode: appConfig.expo.android.versionCode,
    package: config.androidPackage,
    // ... existing code ...
    intentFilters: [
      {
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [{ scheme: config.scheme }, { scheme: config.androidPackage }],
      },
      {
        autoVerify: true,
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [
          { scheme: "https", host: config.appDomainGetConverse, pathPrefix: "/dm" },
          { scheme: "https", host: config.appDomainConverse, pathPrefix: "/dm" },
          // ... existing code ...
        ],
      },
    ],
  },
  // ... existing code ...
});
```

The changes:
1. Removed the destructuring of config properties
2. Renamed the config parameter in the export to `expoConfig` to avoid naming conflict with our `config` variable
3. Updated all references to use `config.property` instead of the destructured variables

This makes the code more explicit about where the values are coming from and follows better practices for object property access.

---



---

