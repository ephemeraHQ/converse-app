## SpecStory

## Expo Permissions: Default vs. Explicit (2/6/2025, 11:00:56 AM)

_**User**_

do we really need all of these or Expo is adding the mby default? which one aren'T added by deffault ?

---

_**Assistant**_

Let me help analyze the permissions in your `app.config.ts` file. Here's a breakdown of which permissions are automatically included by Expo and which ones need to be explicitly added:

Default Expo Permissions (no need to specify):
- `INTERNET` (automatically added)
- `SYSTEM_ALERT_WINDOW` (automatically added)
- `VIBRATE` (automatically added)

Permissions that need explicit declaration if you use them:
- `READ_EXTERNAL_STORAGE` (for file access)
- `WRITE_EXTERNAL_STORAGE` (for file access)
- `POST_NOTIFICATIONS` (for push notifications)
- `READ_CONTACTS` (for contact access)
- `RECEIVE_BOOT_COMPLETED` (for background tasks)
- `WAKE_LOCK` (to keep screen on)
- `USE_FINGERPRINT` (for biometric authentication)
- `USE_BIOMETRIC` (for biometric authentication)
- `READ_MEDIA_IMAGES` (Android 13+ for image access)
- `READ_MEDIA_VIDEO` (Android 13+ for video access)

Based on your code snippets, you're using XMTP for messaging and Privy for wallet functionality. Here's what you likely need:

```typescript:app.config.ts
      permissions: [
        // For notifications
        "POST_NOTIFICATIONS",
        
        // For biometric authentication (if you're using it with Privy)
        "USE_BIOMETRIC",
        
        // For media access (Android 13+)
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO"
      ],
```

The rest can be removed unless you have specific features that require them:
- Remove `READ_CONTACTS` unless you're accessing the device's contact list
- Remove `RECEIVE_BOOT_COMPLETED` unless you need background tasks to start on device boot
- Remove `READ/WRITE_EXTERNAL_STORAGE` as they're replaced by `READ_MEDIA_*` on Android 13+
- Remove `WAKE_LOCK` unless you need to keep the screen on
- Remove `USE_FINGERPRINT` as `USE_BIOMETRIC` is the newer, preferred permission

---

_**User**_

for read+median and rad_video it's alreay handled with plugins below right? same for post_notifi and use_biometract? or no?

---

_**Assistant**_

Let me check the context more carefully. If you're using Expo plugins, many permissions are indeed handled automatically by their respective plugins. Here are the common ones:

- `expo-notifications` plugin handles `POST_NOTIFICATIONS`
- `expo-local-authentication` plugin handles `USE_BIOMETRIC`
- `expo-media-library` plugin handles `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO`

If you have these plugins configured in your `app.config.ts`, you don't need to explicitly declare these permissions. Could you share the plugins section of your `app.config.ts` so I can confirm which permissions are already covered by your plugins?

Without seeing your plugins configuration, I would suggest removing all these permissions and letting the plugins handle them. If you experience any permission-related issues, we can add back only the specific ones needed.

Here's what it would look like:

```typescript:app.config.ts
      permissions: [],  // Let plugins handle the permissions
```

---

_**User**_

does expo-image-picker handler read_media and read_video also?

---

_**Assistant**_

Yes, `expo-image-picker` automatically handles the media permissions including:
- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO`
- `READ_EXTERNAL_STORAGE` (for older Android versions)

You don't need to explicitly declare these permissions if you're using `expo-image-picker`. The plugin will request the appropriate permissions based on the Android version and use case.

So we can keep the simplified version:

```typescript:app.config.ts
      permissions: [],  // All necessary permissions are handled by plugins
```

This is cleaner and lets the plugins manage their own required permissions automatically.

---



---

