const fs = require("fs");

// Path to app.json
const filePath = "./app.json";

// Read app.json
const appJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Increment build numbers
const newBuildNumber = (
  parseInt(appJson.expo.ios.buildNumber, 10) + 1
).toString();
appJson.expo.ios.buildNumber = newBuildNumber;
appJson.expo.android.versionCode = appJson.expo.android.versionCode + 1;

// Write the updated app.json back to the file
fs.writeFileSync(filePath, JSON.stringify(appJson, null, 2) + "\n", "utf-8");

console.log("Version numbers incremented successfully.");
console.log(`::set-output name=new_ios_build_number::${newBuildNumber}`);
