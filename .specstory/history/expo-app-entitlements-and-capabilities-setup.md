## SpecStory

## Expo App Entitlements and Capabilities Setup (2/6/2025, 3:11:27 PM)

_**User**_

but does expo add these by default based on my @app.config.ts ??

---

_**Assistant**_

No, Expo doesn't automatically add these entitlements just by having them in app.config.ts. You need to make sure that:

1. Your Apple Developer account has the appropriate capabilities enabled for your app identifier:
   - Associated Domains capability
   - AutoFill Credential Provider capability
   - Sign In with Apple capability

2. You need to be using EAS Build (not the classic expo build system) and have a paid Apple Developer account.

3. For Associated Domains specifically, you also need to have the appropriate apple-app-site-association (AASA) file hosted on your domains (converse.xyz, getconverse.app, etc.).

The entitlements in app.config.ts tell EAS Build what to include in the app's entitlements when building, but the corresponding capabilities must be enabled in your Apple Developer account first. If you're using EAS Build, it will attempt to automatically configure these capabilities in your Apple Developer account, but it's good practice to verify they're properly set up in the Apple Developer portal.

You can verify these are properly configured by:
1. Going to the Apple Developer portal
2. Selecting your app identifier
3. Checking under the "Capabilities" section

If you're seeing issues with these features not working, double-check both the Apple Developer portal configuration and your AASA file configuration.

---

_**User**_

ok but those aren'T tneeded then??



---

_**Assistant**_

These entitlements ARE needed in your app.config.ts if you want to use:

1. Universal Links / Associated Domains
2. Passkey authentication with AutoFill
3. Sign in with Apple

What I meant in my previous response is that having them in app.config.ts alone isn't sufficient - you also need the corresponding capabilities enabled in your Apple Developer account.

If you're NOT using any of these features, then you can remove the corresponding entitlements:
- Remove `"com.apple.developer.associated-domains"` if you don't need Universal Links
- Remove `"com.apple.developer.authentication-services.autofill-credential-provider"` if you don't need Passkey AutoFill
- Remove `"com.apple.developer.applesignin"` if you don't need Sign in with Apple

But based on your app's configuration and domains setup, it looks like you're using Universal Links at minimum (for deep linking), so you should keep at least that entitlement.

---

_**User**_

i use passkey stuff but what I'm saying is that is there any other config you see in my @app.config.ts  that will add those entitlements wihtout me having to have to put those here :



---

_**Assistant**_

Looking through your app.config.ts, I don't see any plugins or other configurations that would automatically add these entitlements. None of the plugins you're using:

```typescript
plugins: [
  ["expo-notifications"],
  ["expo-local-authentication"],
  ["expo-build-properties"],
  ["expo-image-picker"],
  "expo-secure-store",
  ["expo-splash-screen"],
  ["@sentry/react-native/expo"],
  ["@react-native-firebase/app"],
  ["@react-native-firebase/app-check"],
]
```

automatically add these specific entitlements. You need to explicitly declare them in the entitlements section as you have done.

Even `expo-local-authentication`, which handles biometric authentication, doesn't add passkey-related entitlements. So these explicit entitlement declarations are necessary for your passkey functionality to work.

---

_**User**_

but for ""com.apple.developer.associated-domains": config.ios.associatedDomains," i already have "associatedDomains: config.ios.associatedDomains," ?!

---

_**Assistant**_

Ah, you're absolutely right! In your app.config.ts, you already have:

```typescript:app.config.ts
ios: {
  // ... other ios config ...
  associatedDomains: config.ios.associatedDomains,  // <-- This one
  // ... other ios config ...
  entitlements: {
    "com.apple.developer.associated-domains": config.ios.associatedDomains,  // <-- Redundant!
    // ... other entitlements ...
  }
}
```

The `associatedDomains` property at the iOS config level is sufficient - Expo will automatically add the associated domains entitlement for you. You can remove the redundant entry from the entitlements section.

Here's how the entitlements section should look:

```typescript:app.config.ts
entitlements: {
  // Required to enable passkey autofill in the app
  "com.apple.developer.authentication-services.autofill-credential-provider": true,
  // Required to enable Sign in with Apple functionality
  "com.apple.developer.applesignin": ["Default"],
},
```

---



---

