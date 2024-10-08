const fs = require("fs");
const path = require("path");

// Path to app.json
const filePath = path.join("./app.json");

// Function to increment version number
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

// Get the increment type from command-line arguments
const args = process.argv.slice(2);
const incrementTypeArg = args.find((arg) => arg.startsWith("--bump="));

if (!incrementTypeArg) {
  console.error(
    "Please provide a valid increment type using --bump=<patch|minor|major>"
  );
  process.exit(1);
}

const incrementType = incrementTypeArg.split("=")[1];

// Read app.json
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error("Error reading app.json:", err);
    process.exit(1);
  }

  const appJson = JSON.parse(data);

  // Increment the version for both iOS and Android
  const newVersion = incrementVersion(appJson.expo.version, incrementType);

  appJson.expo.version = newVersion;
  appJson.expo.ios.buildNumber = "1";
  appJson.expo.android.versionCode = appJson.expo.android.versionCode + 1;

  // Write the updated app.json back to the file
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
