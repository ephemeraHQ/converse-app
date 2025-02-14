## SpecStory

## Update EXUpdatesRuntimeVersion in Expo.plist (1/30/2025, 9:31:52 PM)

_**User**_

i also need to update the value of EXUpdatesRuntimeVersion . the version needs to match the version we have in pacjage.json. this file is in ios/Converse/Supporting/Expo.plist

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EXUpdatesCheckOnLaunch</key>
    <string>ALWAYS</string>
    <key>EXUpdatesEnabled</key>
    <true/>
    <key>EXUpdatesLaunchWaitMs</key>
    <integer>0</integer>
    <key>EXUpdatesURL</key>
    <string>https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401</string>
    <key>EXUpdatesRuntimeVersion</key>
    <string>2.2.1</string>
  </dict>
</plist>

---

_**Assistant**_

I'll help you update the script to also modify the EXUpdatesRuntimeVersion in the Expo.plist file. Here's the necessary addition to the code:

```javascript:scripts/build/ios/preview.js
// ... existing code ...

const go = async () => {
  copyGoogleServiceInfo("preview");

  // ... existing code ...

  //
  // Update Expo.plist Runtime Version
  // ----------------------------------------
  const EXPO_PLIST_PATH = "ios/Converse/Supporting/Expo.plist";
  const expoPlist = plist.parse(fs.readFileSync(EXPO_PLIST_PATH, "utf8"));
  expoPlist.EXUpdatesRuntimeVersion = packageJson.version;
  const newExpoPlist = plist.build(expoPlist);
  fs.writeFileSync(EXPO_PLIST_PATH, newExpoPlist, "utf-8");

  // ... existing code ...
};

// ... existing code ...
```

This addition will:
1. Read the Expo.plist file
2. Parse its contents
3. Update the EXUpdatesRuntimeVersion to match the version from package.json
4. Write the updated content back to the file

The code should be added before the final closing brace of the `go` function. This ensures the Expo.plist update happens along with all the other configuration changes.

---



---

