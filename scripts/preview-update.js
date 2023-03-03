const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const plist = require("plist");
const prompt = require("prompt");

const IOS_UPDATE_ID_REGEX = /iOS update ID\s*(.*)/;

const rootPath = path.join(__dirname, "..");
const bundlesPath = path.join(__dirname, "../dist/bundles");
const infoPlistPath = path.join(__dirname, "../ios/Converse/Info.plist");

const uploadUpdatesToExpo = () => {
  console.log("Uploading updates to Expo...");
  execSync("EXPO_ENV=preview eas update --branch preview", {
    cwd: rootPath,
    stdio: "inherit",
    env: {
      EXPO_ENV: "preview",
    },
  });
};

const copyBundlesAndGetMap = () => {
  const bundles = fs.readdirSync(bundlesPath);
  const iosBundle = bundles.find(
    (b) => b.startsWith("ios-") && b.endsWith(".js")
  );
  const iosMap = bundles.find(
    (b) => b.startsWith("ios-") && b.endsWith(".map")
  );
  if (!iosBundle || !iosMap) {
    throw new Error("Could not find an iOS bundle or map");
  }
  fs.copyFileSync(
    path.join(bundlesPath, iosBundle),
    path.join(bundlesPath, "main.jsbundle")
  );
  return iosMap;
};

const uploadBundlesToSentry = (iosUpdateID, iosMap) => {
  const info = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));
  const sentryUploadCommand = `SENTRY_ORG=converse-app SENTRY_PROJECT=converse-react-native SENTRY_AUTH_TOKEN=eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a node_modules/@sentry/cli/bin/sentry-cli releases \
  files com.converse.preview@${info.CFBundleShortVersionString}+${info.CFBundleVersion} \
  upload-sourcemaps \
  --dist ${iosUpdateID} \
  --rewrite \
  dist/bundles/main.jsbundle dist/bundles/${iosMap}`;
  console.log("Uploading bundles to Sentry...");
  try {
    const result = execSync(sentryUploadCommand, { cwd: rootPath });
    console.log(result.toString());
  } catch (e) {
    console.log("An error occured");
  }
};

const go = async () => {
  uploadUpdatesToExpo();
  const { iosUpdateID } = await prompt.get(["iosUpdateID"]);
  const iosMap = copyBundlesAndGetMap();
  uploadBundlesToSentry(iosUpdateID, iosMap);
};

go();
