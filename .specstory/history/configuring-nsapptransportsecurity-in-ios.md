## SpecStory

## Configuring NSAppTransportSecurity in iOS (2/6/2025, 4:47:33 PM)

_**User**_

add NSAppTransportSecurity

---

_**Assistant**_

I'll help you add the NSAppTransportSecurity configuration to the iOS infoPlist section. Here's the edit:

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
            "ledgerlive",
            "rainbow",
            "metamask",
            "trust",
            "uniswap",
            "zerion",
            "exodus",
            "oneinch",
          ],
          NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: true,
          },
        },
      },
// ... existing code ...
```

I've added the `NSAppTransportSecurity` configuration to the `infoPlist` section of the iOS configuration. This setting allows the app to make network requests to servers that don't use HTTPS. Note that while this is sometimes necessary for development or specific use cases, it's generally recommended to use HTTPS in production for security reasons.

---



---

