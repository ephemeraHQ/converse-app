## SpecStory

## iOS Permission Descriptions Update (2/6/2025, 4:59:26 PM)

_**User**_

make suyre to add those 

<key>NSContactsUsageDescription</key>
    <string>We need this to suggest contacts you know.</string>
    <key>NSFaceIDUsageDescription</key>
    <string>We need this to use biometrics to secure your data.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>We need this to record audio messages.</string>

---

_**Assistant**_

I'll help you add those permission descriptions to the iOS configuration. These should be added to the `infoPlist` section under `ios`.

```typescript:app.config.ts
// ... existing code ...
      ios: {
        bundleIdentifier: config.ios.bundleIdentifier,
        supportsTablet: true,
        config: {
          usesNonExemptEncryption: false,
        },
        associatedDomains: config.ios.associatedDomains,
        googleServicesFile: config.ios.googleServicesFile,
        infoPlist: {
          LSApplicationQueriesSchemes: [
            "cbwallet",
            "rainbow",
            "metamask",
            "trust",
            "uniswap",
            "zerion",
            "exodus",
            "oneinch",
          ],
          NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: false,
            NSAllowsLocalNetworking: true,
          },
          NSContactsUsageDescription: "We need this to suggest contacts you know.",
          NSFaceIDUsageDescription: "We need this to use biometrics to secure your data.",
          NSMicrophoneUsageDescription: "We need this to record audio messages.",
        },
      },
// ... existing code ...
```

I've added the three requested permission descriptions to the `infoPlist` section of the iOS configuration. These strings will be displayed to users when the app requests access to contacts, Face ID, or the microphone.

---

_**User**_

do oyu think some of them should be added in the expo plugin config instead?

---

_**Assistant**_

Yes, some of these permissions would be better managed through their respective Expo plugins' configurations. Looking at the current file, I notice we're already using this pattern with `expo-image-picker` where permissions are configured in the plugin section.

Here's how we could reorganize these permissions:

```typescript:app.config.ts
// ... existing code ...
    plugins: [
      ["expo-notifications"],
      ["expo-local-authentication", {
        faceIDPermission: "We need this to use biometrics to secure your data."
      }],
      [
        "expo-build-properties",
        {
          // ... existing config ...
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "We need this so that you can share photos from your library.",
          cameraPermission: "We need this so that you can take photos to share.",
        },
      ],
      ["expo-contacts", {
        contactsPermission: "We need this to suggest contacts you know."
      }],
      // ... rest of plugins ...
    ],
// ... existing code ...
```

The benefits of moving these to plugin configurations are:
1. Better organization - permissions are configured alongside their respective plugins
2. More maintainable - if a plugin's permission requirements change, it's easier to find and update
3. Following Expo's recommended patterns

However, the microphone permission (`NSMicrophoneUsageDescription`) should stay in the `infoPlist` since it's a core iOS permission that isn't tied to a specific Expo plugin in this case.

Would you like me to show you the complete changes needed to reorganize these permissions?

---



---

