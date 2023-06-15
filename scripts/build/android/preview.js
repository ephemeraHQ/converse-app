const { execSync } = require("child_process");
const fs = require("fs");
const isClean = require("git-is-clean");

const replaceAppName = (path) => {
  const content = fs.readFileSync(path, "utf-8");
  const newContent = content.replace(
    /com\.converse\.dev/g,
    "com.converse.preview"
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
    "android/app/src/debug/java/com/converse/dev/ReactNativeFlipper.java";
  const MAIN_FLIPPER_PATH =
    "android/app/src/release/java/com/converse/dev/ReactNativeFlipper.java";
  const MAIN_ACTIVITY_PATH =
    "android/app/src/main/java/com/converse/dev/MainActivity.java";
  const MAIN_APPLICATION_PATH =
    "android/app/src/main/java/com/converse/dev/MainApplication.java";
  const NOTIFICATION_SERVICE_PATH =
    "android/app/src/main/java/com/converse/dev/PushNotificationsService.kt";

  replaceAppName(APP_GRADLE_PATH);
  replaceAppName(DEBUG_FLIPPER_PATH);
  replaceAppName(MAIN_FLIPPER_PATH);
  replaceAppName(MAIN_ACTIVITY_PATH);
  replaceAppName(MAIN_APPLICATION_PATH);
  replaceAppName(NOTIFICATION_SERVICE_PATH);

  const appManifest = fs.readFileSync(APP_MANIFEST_PATH, "utf-8");
  const newAppManifest = appManifest
    .replace(/com\.converse\.dev/g, "com.converse.preview")
    .replace(/converse-dev/g, "converse-preview")
    .replace("dev.getconverse.app", "preview.getconverse.app")
    .replace("dev.converse.xyz", "preview.converse.xyz");
  fs.writeFileSync(APP_MANIFEST_PATH, newAppManifest);

  const googleServices = fs.readFileSync(GOOGLE_SERVICES_PATH, "utf-8");
  const newGoogleServices = JSON.parse(googleServices);
  newGoogleServices.client[0].client_info.mobilesdk_app_id =
    "1:564961909146:android:2faf5c4a2bbcd133bd0223";
  newGoogleServices.client[0].client_info.android_client_info.package_name =
    "com.converse.preview";

  fs.writeFileSync(
    GOOGLE_SERVICES_PATH,
    JSON.stringify(newGoogleServices, null, 2)
  );

  const strings = fs.readFileSync(STRINGS_PATH, "utf-8");
  const newStrings = strings.replace(
    '<string name="app_name">Converse DEV</string>',
    '<string name="app_name">Converse PREVIEW</string>'
  );
  fs.writeFileSync(STRINGS_PATH, newStrings);

  const CODE_PATH = "android/app/src/main/java/com/converse/dev";
  const NEW_CODE_PATH = "android/app/src/main/java/com/converse/preview";

  execSync(`git mv ${CODE_PATH} ${NEW_CODE_PATH}`);
};

go();
