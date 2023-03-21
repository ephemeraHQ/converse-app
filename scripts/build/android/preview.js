const fs = require("fs");
const isClean = require("git-is-clean");

const go = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index is not clean");
    process.exit(1);
  }

  const APP_GRADLE_PATH = "android/app/build.gradle";
  const APP_MANIFEST_PATH = "android/app/src/main/AndroidManifest.xml";
  const GOOGLE_SERVICES_PATH = "android/app/google-services.json";

  const CODE_PATH = "android/app/src/main/java/com/converse/dev";
  const NEW_CODE_PATH = "android/app/src/main/java/com/converse/preview";

  const appGradle = fs.readFileSync(APP_GRADLE_PATH, "utf-8");
  const appManifest = fs.readFileSync(APP_MANIFEST_PATH, "utf-8");
  const googleServices = fs.readFileSync(GOOGLE_SERVICES_PATH, "utf-8");

  const newAppGradle = appGradle.replace(
    /com\.converse\.dev/g,
    "com.converse.preview"
  );

  const newAppManifest = appManifest
    .replace(/com\.converse\.dev/g, "com.converse.preview")
    .replace(/converse-dev/g, "converse-preview");

  const newGoogleServices = JSON.parse(googleServices);
  newGoogleServices.client[0].client_info.mobilesdk_app_id =
    "1:564961909146:android:2faf5c4a2bbcd133bd0223";
  newGoogleServices.client[0].client_info.android_client_info.package_name =
    "com.converse.preview";

  fs.writeFileSync(
    GOOGLE_SERVICES_PATH,
    JSON.stringify(newGoogleServices, null, 2)
  );

  fs.writeFileSync(APP_GRADLE_PATH, newAppGradle);
  fs.writeFileSync(APP_MANIFEST_PATH, newAppManifest);

  fs.renameSync(CODE_PATH, NEW_CODE_PATH);
};

go();
