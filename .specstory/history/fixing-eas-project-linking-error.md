## SpecStory

## Fixing EAS Project Linking Error (1/24/2025, 10:47:43 AM)

_**User**_

why i get "✖ Linking local project to EAS project 49a65fae-3895-4487-8e8a-5bd8bee3a401
Cannot read properties of undefined (reading 'projectId')
    Error: config command failed."

---

_**Assistant**_

This error occurs because there are two `extra` properties in your Expo config, which is causing the second one to override the first. Let's fix the configuration by merging the `extra` properties.

Here's how to fix it:

```typescript:app.config.ts
// ... existing code ...

  return {
    ...defaultConfig,
    name: config.appName,
    scheme: config.scheme,
    // ... existing code ...
    
    // Remove this first extra property
    extra: {
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
    },
    android: {
      // ... existing android config ...
    },
    plugins: [
      // ... existing plugins ...
    ],
    // Merge both extra properties into one
    extra: {
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
      environment,
    },
  };
};
```

The issue was that you had two separate `extra` properties in your configuration object. In JavaScript/TypeScript, when you have duplicate keys in an object, the last one overwrites any previous ones. This was causing the `eas.projectId` to be lost, leading to the error you encountered.

The fix combines both `extra` properties into a single object with both the `eas` configuration and the `environment` value.

---

_**User**_

why do i need "projectId" and "environemt"? read in expo doc

---

_**Assistant**_

Let me explain the purpose of each:

1. `projectId` is required for EAS (Expo Application Services) to:
- Link your local project to your Expo project in the cloud
- Enable EAS Build, EAS Submit, and EAS Update services
- Enable over-the-air (OTA) updates

You can find this in the [EAS documentation](https://docs.expo.dev/build/setup/#configure-your-project).

2. `environment` in your case is a custom configuration value that you're using to:
- Determine which environment settings to use (dev/preview/prod)
- Configure different bundle IDs, package names, and domains for each environment
- This is not an Expo requirement, but rather your app's specific configuration need

Here's how you should structure it based on Expo's best practices:

```typescript:app.config.ts
// ... existing code ...

  return {
    ...defaultConfig,
    name: config.appName,
    scheme: config.scheme,
    // ... existing code ...
    
    extra: {
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401", // Required for EAS services
      },
      environment, // Your custom environment configuration
    },
  };
```

If you want to simplify your configuration, you could remove the `environment` from `extra` if you're not explicitly using it in your app code through `Constants.expoConfig.extra.environment`. Instead, you could use environment variables or a different configuration management approach.

---



---

