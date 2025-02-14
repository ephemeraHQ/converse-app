## SpecStory

## Privy Passkey Setup Configuration (2/6/2025, 2:56:51 PM)

_**User**_

is this good for Privy expo passkey setup?
Check
@https://docs.privy.io/guide/expo/authentication/passkey  and @https://docs.privy.io/guide/expo/setup/passkey 

---

_**Assistant**_

Based on the current file and the Privy documentation, your `test.json` appears to be an Apple App Site Association (AASA) file, but it needs some modifications to properly support passkeys for Privy integration. Here's what I recommend:

```json:features/onboarding/passkey/test.json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "3L9E5TA22P.com.converse.dev",
        "paths": [
          "/dm/*",
          "/coinbase",
          "/mobile-wallet-protocol",
          "/desktopconnect/*",
          "/group/*",
          "/group-invite/*",
          "/poap/*"
        ]
      },
      {
        "appID": "Q6W2FLK8DM.com.converse.dev",
        "paths": [
          "/dm/*",
          "/coinbase",
          "/mobile-wallet-protocol",
          "/desktopconnect/*",
          "/group/*",
          "/group-invite/*",
          "/poap/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["Q6W2FLK8DM.com.converse.dev", "3L9E5TA22P.com.converse.dev"]
  },
  "activitycontinuation": {
    "apps": ["Q6W2FLK8DM.com.converse.dev", "3L9E5TA22P.com.converse.dev"]
  }
}
```

The key changes/notes:

1. I've added the `activitycontinuation` section which is recommended for passkey support.

2. The existing `webcredentials` section is correct and matches Privy's requirements for passkey setup.

3. Make sure this file is accessible at:
```
https://<your_domain>/.well-known/apple-app-site-association
```

Additionally, for a complete passkey setup, you'll need to:

1. Update your Expo app configuration to include associated domains
2. Create a Digital Asset Links file for Android support
3. Set the proper iOS deployment target
4. Configure the Metro bundler

Would you like me to provide the configuration details for any of these additional steps?

---

_**User**_

waht do you mean by "pdate your Expo app configuration to include associated domains"? and also look at @metro.config.js  and @app.config.ts if i already added some of the stuff you recommended

---

_**Assistant**_

Looking at your configuration files, you've already implemented most of the required setup for Privy passkeys. Let's review what you have and what might need to be added:

1. **Associated Domains (✅ Already Configured)**
In your `app.config.ts`, you already have the associated domains set up correctly for each environment:
```typescript
associatedDomains: [
  "applinks:dev.converse.xyz",
  "applinks:dev.getconverse.app",
  "webcredentials:dev.converse.xyz",
],
```

2. **Metro Configuration (✅ Already Configured)**
Your `metro.config.js` has the necessary Privy configuration:
```javascript
const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  if (moduleName.startsWith("@privy-io/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: true,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
```

The only things you might need to add are:

1. **Digital Asset Links for Android**
Create a file at `/.well-known/assetlinks.json` with content like:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.converse.dev",
    "sha256_cert_fingerprints": ["your-sha256-fingerprint"]
  }
}]
```

2. **iOS Deployment Target**
Make sure your iOS deployment target is iOS 16 or higher for passkey support. You can add this to your `app.config.ts`:
```typescript:app.config.ts
ios: {
  // ... your existing iOS config ...
  deploymentTarget: "16.0",  // Add this line
},
```

Your setup is already quite complete for Privy passkeys. The main thing left would be setting up the Digital Asset Links file for Android and ensuring your iOS deployment target is set correctly.

Would you like me to provide more details about any of these remaining steps?

---



---

