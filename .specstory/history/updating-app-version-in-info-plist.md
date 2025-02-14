## SpecStory

## Updating App Version in Info.plist (1/27/2025, 1:48:49 PM)

_**User**_

how can i also set the build app version in info.plist like this value

<key>CFBundleShortVersionString</key>
    <string>2.1.0</string>

---

_**Assistant**_

I'll help you add the version update to the Info.plist modification section. Here's the edit needed:

```javascript:scripts/build/ios/preview.js
// ... existing code ...

  // Update main app Info.plist
  const appInfo = plist.parse(fs.readFileSync(PLIST_APP_PATH, "utf8"));
  appInfo.CFBundleDisplayName = "Converse PREVIEW";
  appInfo.CFBundleURLSchemes = ["converse-preview", "com.converse.preview"];
  appInfo.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse-preview",
    "com.converse.preview",
  ];
  // Add version number
  appInfo.CFBundleShortVersionString = "2.1.0";
  const newAppInfo = plist.build(appInfo);
  fs.writeFileSync(PLIST_APP_PATH, newAppInfo, "utf-8");

// ... existing code ...
```

I've added the line `appInfo.CFBundleShortVersionString = "2.1.0";` just before building the new plist content. This will set the app's version number to 2.1.0 in the Info.plist file. You can adjust the version number as needed.

---

_**User**_

get the version number from the "version" of package.json

---

_**Assistant**_

I'll help you import and use the version from package.json. Here's the edit:

```javascript:scripts/build/ios/preview.js
const fs = require("fs");
const plist = require("plist");
const { copyGoogleServiceInfo } = require("../build.utils.js");
// Add package.json import
const packageJson = require("../../../package.json");

// ... existing code ...

  // Update main app Info.plist
  const appInfo = plist.parse(fs.readFileSync(PLIST_APP_PATH, "utf8"));
  appInfo.CFBundleDisplayName = "Converse PREVIEW";
  appInfo.CFBundleURLSchemes = ["converse-preview", "com.converse.preview"];
  appInfo.CFBundleURLTypes[0].CFBundleURLSchemes = [
    "converse-preview",
    "com.converse.preview",
  ];
  // Get version from package.json
  appInfo.CFBundleShortVersionString = packageJson.version;
  const newAppInfo = plist.build(appInfo);
  fs.writeFileSync(PLIST_APP_PATH, newAppInfo, "utf-8");

// ... existing code ...
```

I've made two changes:
1. Added the import for package.json at the top of the file
2. Used `packageJson.version` to set the CFBundleShortVersionString value

This will automatically keep your iOS app version in sync with the version specified in your package.json file.

---



---

