const { execSync } = require("child_process");
const fs = require("fs");

const { findFilesRecursively } = require("./utils");

const replaceAppName = (path) => {
  const content = fs.readFileSync(path, "utf-8");
  const newContent = content.replace(
    /com\.converse\.dev/g,
    "com.converse.prod"
  );
  fs.writeFileSync(path, newContent);
};

const go = async () => {
  const APP_GRADLE_PATH = "android/app/build.gradle";
  const APP_MANIFEST_PATH = "android/app/src/main/AndroidManifest.xml";
  const STRINGS_PATH = "android/app/src/main/res/values/strings.xml";
  const GOOGLE_SERVICES_PATH = "android/app/google-services.json";

  const APP_FILES_PATH = "android/app/src/main/java/com/converse/dev";

  replaceAppName(APP_GRADLE_PATH);

  findFilesRecursively(APP_FILES_PATH).map((f) => replaceAppName(f));

  const appManifest = fs.readFileSync(APP_MANIFEST_PATH, "utf-8");
  const newAppManifest = appManifest
    .replace(/com\.converse\.dev/g, "com.converse.prod")
    .replace(/converse-dev/g, "converse")
    .replace(/ic_launcher_preview/g, "ic_launcher")
    .replace(/dev\.getconverse\.app/g, "getconverse.app")
    .replace(/dev\.converse\.xyz/g, "converse.xyz");
  fs.writeFileSync(APP_MANIFEST_PATH, newAppManifest);

  const googleServices = fs.readFileSync(GOOGLE_SERVICES_PATH, "utf-8");
  const newGoogleServices = JSON.parse(googleServices);
  newGoogleServices.client[0].client_info.mobilesdk_app_id =
    "1:564961909146:android:7490961d2153aca8bd0223";
  newGoogleServices.client[0].client_info.android_client_info.package_name =
    "com.converse.prod";

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

  const CODE_PATH = "android/app/src/main/java/com/converse/dev";
  const NEW_CODE_PATH = "android/app/src/main/java/com/converse/prod";

  execSync(`git mv ${CODE_PATH} ${NEW_CODE_PATH}`);
};

go();
