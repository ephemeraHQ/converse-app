## SpecStory

## Expo Config Parsing Error Fix (2/6/2025, 10:50:48 AM)

_**User**_

why i. get "ould not parse Expo config: android.googleServicesFile: "./google-services/development.json" in @app.config.ts when expo prebuild

---

_**Assistant**_

Looking at your config and the error, I notice there's a mismatch in the file paths between your config and actual file structure. The issue is with the Android Google Services file path.

In your `app.config.ts`, the development configuration specifies:
```typescript:app.config.ts
// ... existing code ...
development: {
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./google-services/development.json",  // This path is incorrect
    },
// ... existing code ...
```

But your actual Google Services file is located at `google-services/android/development.json`. Let's fix the path in the config:

```typescript:app.config.ts
// ... existing code ...
development: {
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./google-services/android/development.json",
    },
// ... existing code ...
```

You'll need to make similar updates for the preview and production environments as well:

```typescript:app.config.ts
// ... existing code ...
preview: {
    android: {
      package: "com.converse.preview",
      googleServicesFile: "./google-services/android/preview.json",
    },
// ... existing code ...
production: {
    android: {
      package: "com.converse.prod",
      googleServicesFile: "./google-services/android/production.json",
    },
// ... existing code ...
```

This should resolve the parsing error by pointing to the correct file paths where your Google Services JSON files are actually located.

---



---

