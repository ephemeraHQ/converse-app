const { execSync } = require("child_process");
const fs = require("fs");
const isClean = require("git-is-clean");

const replaceAppName = (path) => {
  const content = fs.readFileSync(path, "utf-8");
  const newContent = content.replace(
    /com\.converse\.dev/g,
    "com.converse.native"
  );
  fs.writeFileSync(path, newContent);
};

const go = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index is not clean");
    process.exit(1);
  }

  const APP_GRADLE_PATH = "android/app/build.gradle";
  const APP_MANIFEST_PATH = "android/app/src/main/AndroidManifest.xml";
  const STRINGS_PATH = "android/app/src/main/res/values/strings.xml";
  const GOOGLE_SERVICES_PATH = "android/app/google-services.json";
  const DEBUG_FLIPPER_PATH =
    "android/app/src/debug/java/com/converse/app/ReactNativeFlipper.java";
  const MAIN_FLIPPER_PATH =
    "android/app/src/release/java/com/converse/app/ReactNativeFlipper.java";
  const MAIN_ACTIVITY_PATH =
    "android/app/src/main/java/com/converse/app/MainActivity.java";
  const MAIN_APPLICATION_PATH =
    "android/app/src/main/java/com/converse/app/MainApplication.java";

  replaceAppName(APP_GRADLE_PATH);
  replaceAppName(DEBUG_FLIPPER_PATH);
  replaceAppName(MAIN_FLIPPER_PATH);
  replaceAppName(MAIN_ACTIVITY_PATH);
  replaceAppName(MAIN_APPLICATION_PATH);

  const appManifest = fs.readFileSync(APP_MANIFEST_PATH, "utf-8");
  const newAppManifest = appManifest
    .replace(/com\.converse\.dev/g, "com.converse.native")
    .replace(/converse-dev/g, "converse")
    .replace(/ic_launcher_preview/g, "ic_launcher")
    .replace("dev.getconverse.app", "getconverse.app");
  fs.writeFileSync(APP_MANIFEST_PATH, newAppManifest);

  const googleServices = fs.readFileSync(GOOGLE_SERVICES_PATH, "utf-8");
  const newGoogleServices = JSON.parse(googleServices);
  newGoogleServices.client[0].client_info.mobilesdk_app_id =
    "1:564961909146:android:cf91e864d5f191b1bd0223";
  newGoogleServices.client[0].client_info.android_client_info.package_name =
    "com.converse.native";

  fs.writeFileSync(
    GOOGLE_SERVICES_PATH,
    JSON.stringify(newGoogleServices, null, 2)
  );

  const strings = fs.readFileSync(STRINGS_PATH, "utf-8");
  const newStrings = strings.replace(
    '<string name="app_name">Converse DEV</string>',
    '<string name="app_name">Converse</string>'
  );
  fs.writeFileSync(STRINGS_PATH, newStrings);
};

go();
