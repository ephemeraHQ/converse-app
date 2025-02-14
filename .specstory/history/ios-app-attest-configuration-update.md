## SpecStory

## iOS App Attest Configuration Update (2/6/2025, 7:38:04 PM)

_**User**_

add this "<key>com.apple.developer.devicecheck.appattest-environment</key>
	<string>production</string>"

---

_**Assistant**_

I'll help you add the devicecheck appattest environment configuration to the iOS infoPlist section. Here's the edit:

```typescript:app.config.ts
// ... existing code ...
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
        "com.apple.developer.devicecheck.appattest-environment": "production",
      },
// ... existing code ...
```

I've added the devicecheck appattest environment configuration to the iOS infoPlist section. This setting enables App Attest in production mode for your iOS app, which helps prevent app cloning and provides additional security features.

---

_**User**_

is there a cleaner way? This is acutally in the entitlement file

---

_**Assistant**_

Ah yes, you're right! For entitlements, we should add it to the iOS configuration using the `entitlements` property. Here's the cleaner way:

```typescript:app.config.ts
// ... existing code ...
    ios: {
      usesAppleSignIn: true,
      bundleIdentifier: config.ios.bundleIdentifier,
      supportsTablet: true,
      associatedDomains: config.ios.associatedDomains,
      googleServicesFile: config.ios.googleServicesFile,
      config: {
        usesNonExemptEncryption: false,
      },
      entitlements: {
        "com.apple.developer.devicecheck.appattest-environment": "production"
      },
      infoPlist: {
// ... existing code ...
```

This is the more appropriate way to add the App Attest environment configuration since it's an entitlement rather than an Info.plist property. This will properly add it to the app's entitlements file.

---



---

