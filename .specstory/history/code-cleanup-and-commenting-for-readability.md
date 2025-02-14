## SpecStory

## Code Cleanup and Commenting for Readability (1/19/2025, 2:59:04 PM)

_**User**_

clean and put some comments to make it more readble. Don'T add comments if it,s obvious 

---

_**Assistant**_

I'll clean up the code and add helpful comments where the logic might not be immediately obvious. Here's the improved version:

```javascript:scripts/build/incrementVersion.js
const fs = require("fs");
const path = require("path");

const filePath = path.join("./app.json");

// Increments semantic version based on the specified type (patch, minor, or major)
// Example: 1.2.3 -> 1.2.4 (patch), 1.3.0 (minor), or 2.0.0 (major)
function incrementVersion(version, incrementType) {
  const parts = version.split(".").map(Number);

  switch (incrementType) {
    case "patch":
      parts[2] += 1;
      break;
    case "minor":
      parts[1] += 1;
      parts[2] = 0;
      break;
    case "major":
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      console.error('Invalid increment type. Use "patch", "minor", or "major".');
      process.exit(1);
  }

  return parts.join(".");
}

// Parse command line argument for version bump type
const args = process.argv.slice(2);
const incrementTypeArg = args.find((arg) => arg.startsWith("--bump="));

if (!incrementTypeArg) {
  console.error(
    "Please provide a valid increment type using --bump=<patch|minor|major>"
  );
  process.exit(1);
}

const incrementType = incrementTypeArg.split("=")[1];

// Update version numbers in app.json
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error("Error reading app.json:", err);
    process.exit(1);
  }

  const appJson = JSON.parse(data);
  const newVersion = incrementVersion(appJson.expo.version, incrementType);

  // Update Expo version and platform-specific version numbers
  // iOS: Reset build number to 1 for each version update
  // Android: Increment the version code by 1
  appJson.expo.version = newVersion;
  appJson.expo.ios.buildNumber = "1";
  appJson.expo.android.versionCode = appJson.expo.android.versionCode + 1;

  fs.writeFile(
    filePath,
    JSON.stringify(appJson, null, 2) + "\n",
    "utf-8",
    (err) => {
      if (err) {
        console.error("Error writing app.json:", err);
        process.exit(1);
      }
      console.log(`Version updated to ${newVersion} successfully.`);
    }
  );
});
```

Changes made:
1. Removed redundant comments for obvious operations
2. Added detailed comment explaining the semantic versioning increment function
3. Added clarifying comments about platform-specific version number handling
4. Improved section separation with descriptive comments
5. Maintained consistent code formatting

The code is now more readable with meaningful comments that explain the non-obvious parts of the implementation, particularly around version number handling for different platforms.

---



---

