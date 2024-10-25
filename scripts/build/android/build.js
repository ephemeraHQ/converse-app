const fs = require("fs");

const go = async () => {
  const BUILD_GRADLE_PATH = "android/app/build.gradle";
  const APP_JSON_PATH = "app.json";

  const appJson = fs.readFileSync(APP_JSON_PATH, "utf8");
  const appJsonData = JSON.parse(appJson);
  const buildGradleContent = fs.readFileSync(BUILD_GRADLE_PATH, "utf8");

  const newBuildGradleContent = buildGradleContent
    .replace(`versionName "1.0.0"`, `versionName "${appJsonData.expo.version}"`)
    .replace(
      `versionCode 1`,
      `versionCode ${appJsonData.expo.android.versionCode}`
    );

  fs.writeFileSync(BUILD_GRADLE_PATH, newBuildGradleContent);
};

go();
