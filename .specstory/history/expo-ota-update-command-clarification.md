## SpecStory

## Expo OTA Update Command Clarification (2/11/2025, 10:05:23 AM)

_**User**_

i don't need --auto here right? Read the docs for expo OTA

---

_**Assistant**_

Let me check the Expo OTA update documentation and suggest the appropriate changes.

According to the Expo documentation, the `--auto` flag is used to automatically select the target runtime version based on your project's configuration. However, since we're using a specific channel (preview), we don't need this flag as it's redundant in this case.

Here's the edit I suggest:

```yaml:.github/workflows/preview-deployment.yml
// ... existing code ...

      - name: Run EAS Update
        run: |
          eas update --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive

// ... existing code ...
```

The `--auto` flag was removed because:
1. We're explicitly targeting the preview channel
2. The runtime version will be automatically determined from our app.config.ts
3. It's cleaner and more explicit about our intentions

The rest of the command remains the same:
- `--channel=preview`: Specifies the update channel
- `--message`: Includes the commit message for tracking purposes
- `--non-interactive`: Prevents any prompts during CI execution

---

_**User**_

what the fuck is hpapeing . I don't get the OTA updates on my phone. But I setup the thing correctly no? Like the runtimeVersion stuff?? @https://docs.expo.dev/eas-update/runtime-versions/ 

---

_**Assistant**_

Let me help you troubleshoot the OTA update issue. Based on the documentation, there are a few critical things to check:

1. First, we need to verify your `app.config.ts` has the correct runtime version configuration. There are several ways to set it:

```typescript
// Option 1: Using appVersion policy (recommended)
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}

// Option 2: Using sdkVersion policy
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}

// Option 3: Manual version
{
  "expo": {
    "runtimeVersion": "1.0.0"
  }
}
```

2. Common issues that prevent OTA updates from working:

- The runtime version in your production build doesn't match the runtime version of your updates
- You haven't configured the correct update channel in your app.config.ts
- The native code has changed but the runtime version wasn't updated

Could you share your `app.config.ts` file? That would help me identify if there's a configuration issue.

Also, to debug this:

1. Check if your app is actually checking for updates by adding some debug logs:
```typescript
import * as Updates from 'expo-updates';

// Add this somewhere in your app startup
try {
  const update = await Updates.checkForUpdateAsync();
  console.log('Update available:', update.isAvailable);
} catch (error) {
  console.error('Error checking for updates:', error);
}
```

2. Verify the channel your app is using:
```typescript
console.log('Current update channel:', Updates.channel);
```

3. Check your runtime version:
```typescript
console.log('Runtime version:', Updates.runtimeVersion);
```

[According to the docs](https://docs.expo.dev/eas-update/runtime-versions/#avoiding-crashes-with-incompatible-updates), you should:
1. Create a preview build and test it on a device
2. Publish the update to the "preview" branch first
3. Verify it works before publishing to production

Let me know your `app.config.ts` contents and I can help you fix this!

---



---

