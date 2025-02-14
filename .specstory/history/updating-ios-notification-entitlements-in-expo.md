## SpecStory

## Updating iOS Notification Entitlements in Expo (2/6/2025, 8:23:51 AM)

_**User**_

add ios notificcaiton entitlement that i have. it was like this in my ios folder. But now i want to remove the ios folder to handle everythign in app.config.ts with expo. Entitlement file name was "ConverseNotificationExtension.entitlements" . Not sure if it matthers.

 "<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>group.com.converse.dev</string>
	</array>
	<key>keychain-access-groups</key>
	<array>
		<string>$(AppIdentifierPrefix)com.converse.dev</string>
	</array>
</dict>
</plist>


---

_**Assistant**_

I'll help you add the iOS notification entitlements to your app.config.ts file. In Expo, you can configure entitlements through the `ios.entitlements` field in your app configuration.

Here's how you should modify your app.config.ts to include the notification extension entitlements:

```typescript:app.config.ts
// Inside the ExpoConfig return object, add/modify the ios configuration:
ios: {
  supportsTablet: true,
  config: {
    usesNonExemptEncryption: false,
  },
  entitlements: {
    "com.apple.security.application-groups": [`group.${config.ios.bundleIdentifier}`],
    "keychain-access-groups": [`$(AppIdentifierPrefix)${config.ios.bundleIdentifier}`]
  }
}
```

This should be added to your existing configuration around:

```97:103:app.config.ts
    ios: {
      // bundleIdentifier: config.ios.bundleIdentifier, // Not needed since we have ios folder already specifying it
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
    },
```


The entitlements will be automatically applied during the build process. The values will also automatically update based on your environment (development, preview, production) since we're using the `config.ios.bundleIdentifier` value that changes per environment.

Note that if you're using EAS Build, you'll need to make sure your provisioning profile includes these entitlements. You may need to:

1. Configure these entitlements in your Apple Developer account
2. Create new provisioning profiles that include these entitlements
3. Update your EAS build configuration to use the correct provisioning profile

Also, since you're moving from a native iOS setup to Expo config, make sure to:

1. Remove the `ios/ConverseNotificationExtension.entitlements` file
2. Update any code that references these entitlements to use the new configuration
3. Test push notifications thoroughly after making these changes

Would you like me to provide more details about any of these steps?

---

_**User**_

ok nevermind i don't think i'll add. the entitlements stuff. Not sure it's needed finally

---

_**Assistant**_

That's fine! If you find you need the entitlements later for specific iOS functionality (like shared app groups or keychain access), you can always add them back through the app.config.ts configuration.

For now, you can continue using your app without these specific entitlements. Just make sure to test your app's functionality thoroughly, particularly around any features that might have depended on these entitlements (if any).

Let me know if you need help with anything else!

---



---

