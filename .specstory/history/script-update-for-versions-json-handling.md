## SpecStory

## Script Update for versions.json Handling (1/24/2025, 10:26:56 AM)

_**User**_

make sure it works with @versions.json 

---

_**Assistant**_

I'll help modify the script to ensure it works with the versions.json file. The main issue is that we should add error handling and verify the file exists before trying to read it.

Here's the updated code:

```javascript:scripts/build/increment-app-version-minor.js
const fs = require("fs");
const path = require("path");

// Path to versions.json
const versionsPath = path.join(__dirname, "versions.json");

try {
  // Check if file exists
  if (!fs.existsSync(versionsPath)) {
    throw new Error(`versions.json not found at ${versionsPath}`);
  }

  // Load versions.json
  const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

  // Validate versions object structure
  if (!versions.appVersion || typeof versions.appVersion !== "string") {
    throw new Error("Invalid versions.json format: missing or invalid appVersion");
  }

  // Increment the version (e.g., 2.1.4 -> 2.2.0)
  function incrementVersion(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid version format: ${version}`);
    }
    const [major, minor, patch] = parts;
    return `${major}.${minor + 1}.0`;
  }

  // Update the version
  const newVersion = incrementVersion(versions.appVersion);
  versions.appVersion = newVersion;

  // Write the updated file
  fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + "\n");

  console.log(`Version incremented to ${newVersion}`);
} catch (error) {
  console.error("Error updating version:", error.message);
  process.exit(1);
}
```

Key changes made:
1. Added error handling with try/catch block
2. Added file existence check
3. Added validation for the versions object structure
4. Added validation for version format
5. Added proper error messages and exit code for failures
6. Added a newline at the end of the JSON file when writing
7. Fixed the comment to show the actual version increment pattern (2.1.4 -> 2.2.0)

The script will now handle errors gracefully and ensure the versions.json file is properly formatted before attempting to update it.

---

_**User**_

too many checks. Assume versions.json is there

---

_**Assistant**_

Here's the simplified version that assumes versions.json exists:

```javascript:scripts/build/increment-app-version-minor.js
const fs = require("fs");
const path = require("path");

// Path to versions.json
const versionsPath = path.join(__dirname, "versions.json");

// Load versions.json
const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

// Increment the version (e.g., 2.1.4 -> 2.2.0)
function incrementVersion(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor + 1}.0`;
}

// Update the version
const newVersion = incrementVersion(versions.appVersion);
versions.appVersion = newVersion;

// Write the updated file
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + "\n");

console.log(`Version incremented to ${newVersion}`);
```

The only changes made:
1. Added a newline at the end of the JSON file when writing
2. Updated the comment to show the correct version increment pattern (2.1.4 -> 2.2.0)

---



---

