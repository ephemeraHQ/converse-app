const fs = require("fs");
const path = require("path");

// Path to versions.json
const filePath = path.join("./versions.json");

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
      console.error(
        'Invalid increment type. Use "patch", "minor", or "major".'
      );
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

// Update version numbers in versions.json
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error("Error reading versions.json:", err);
    process.exit(1);
  }

  const versionsJson = JSON.parse(data);
  const newAppVersion = incrementVersion(versionsJson.version, incrementType);

  // Update Expo version and platform-specific version numbers
  // iOS: Reset build number to 1 for each version update
  // Android: Increment the version code by 1
  versionsJson.version = newAppVersion;
  versionsJson.ios.buildNumber = "1";
  versionsJson.android.versionCode = versionsJson.android.versionCode + 1;

  fs.writeFile(
    filePath,
    JSON.stringify(versionsJson, null, 2) + "\n",
    "utf-8",
    (err) => {
      if (err) {
        console.error("Error writing versions.json:", err);
        process.exit(1);
      }
      console.log(`Version updated to ${newAppVersion} successfully.`);
    }
  );
});
