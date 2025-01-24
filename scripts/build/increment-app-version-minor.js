const fs = require("fs");
const path = require("path");

// Path to versions.json
const versionsPath = path.join(__dirname, "versions.json");

// Load versions.json
const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

// Increment the version (e.g., 2.1.0 -> 2.2.0)
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
