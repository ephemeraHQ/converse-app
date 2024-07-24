const fs = require("fs");

// Path to app.json
const filePath = "./app.json";

// Read app.json
const appJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Increment build numbers
appJson.expo.ios.buildNumber = (
  parseInt(appJson.expo.ios.buildNumber, 10) + 1
).toString();
appJson.expo.android.versionCode = appJson.expo.android.versionCode + 1;

// Write the updated app.json back to the file
fs.writeFileSync(filePath, JSON.stringify(appJson, null, 2), "utf-8");

console.log("Version numbers incremented successfully.");
