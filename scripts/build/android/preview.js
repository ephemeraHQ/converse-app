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

  const appGradle = fs.readFileSync(APP_GRADLE_PATH, "utf-8");
  const appManifest = fs.readFileSync(APP_MANIFEST_PATH, "utf-8");

  const newAppGradle = appGradle.replace(
    /com\.converse\.dev/g,
    "com.converse.preview"
  );

  const newAppManifest = appManifest
    .replace(/com\.converse\.dev/g, "com.converse.preview")
    .replace(/converse-dev/g, "converse-preview");

  fs.writeFileSync(APP_GRADLE_PATH, newAppGradle);
  fs.writeFileSync(APP_MANIFEST_PATH, newAppManifest);
};

go();
