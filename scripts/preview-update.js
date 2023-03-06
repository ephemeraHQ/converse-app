const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const plist = require("plist");
const prompt = require("prompt");

const IOS_UPDATE_ID_REGEX = /iOS update ID\s*(.*)/;

const rootPath = path.join(__dirname, "..");
const bundlesPath = path.join(__dirname, "../dist/bundles");
const infoPlistPath = path.join(__dirname, "../ios/Converse/Info.plist");

const uploadUpdatesToExpo = () =>
  new Promise((resolve) => {
    console.log("Uploading updates to Expo...");
    const eas = spawn("eas", ["update", "--branch", "preview"], {
      env: { EXPO_ENV: "preview", PATH: process.env.PATH },
      cwd: rootPath,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let allOutput = "";

    eas.stdout.on("data", function (data) {
      const str = data.toString();
      allOutput = `${allOutput}${str}`;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(str);
    });

    eas.stderr.on("data", function (data) {
      const str = data.toString("utf-8").trim();
      process.stderr.clearLine();
      process.stderr.cursorTo(0);
      process.stderr.write(str);
    });

    eas.on("close", () => {
      const match = allOutput.match(IOS_UPDATE_ID_REGEX);
      if (match) {
        resolve(match[1].trim());
      } else {
        resolve();
      }
    });
  });

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
  const iosUpdateID = await uploadUpdatesToExpo();
  const iosMap = copyBundlesAndGetMap();
  uploadBundlesToSentry(iosUpdateID, iosMap);
};

go();
