## SpecStory

## Incrementing Version in versions.json (1/23/2025, 11:04:58 PM)

_**User**_

why in appjson? I jsut want to increment in versions.json

---

_**Assistant**_

I'll modify the script to only update the versions.json file and remove the app.json related code. Here's the simplified version:

```javascript:scripts/build/increment-version.js
const fs = require('fs');
const path = require('path');

// Path to versions.json
const versionsPath = path.join(__dirname, 'versions.json');

// Load versions.json
const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));

// Increment the version (e.g., 2.0.0 -> 2.0.1)
function incrementVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// Update the version
const newVersion = incrementVersion(versions.version);
versions.version = newVersion;

// Write the updated file
fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));

console.log(`Version incremented to ${newVersion}`);
```

Changes made:
1. Removed all app.json related code (path, loading, and writing)
2. Simplified the script to only handle versions.json
3. Kept the core version incrementing functionality unchanged

The script now only reads from and writes to versions.json, incrementing just that version number.

---



---

