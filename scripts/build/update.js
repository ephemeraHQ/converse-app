const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const prompts = require("prompts");

const appJson = require("../../app.json");

const IOS_UPDATE_ID_REGEX = /iOS update ID\s*(.*)/;
const ANDROID_UPDATE_ID_REGEX = /Android update ID\s*(.*)/;

const rootPath = path.join(__dirname, "../..");
const bundlesPath = path.join(__dirname, "../../dist/bundles");

const uploadUpdatesToExpo = (env) =>
  new Promise((resolve) => {
    console.log("Uploading updates to Expo...");
    const updateEnv = { PATH: process.env.PATH };
    if (env === "preview") {
      updateEnv.EXPO_ENV = "preview";
    }

    const eas = spawn("eas", ["update", "--branch", env], {
      env: updateEnv,
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
      const iosMatch = allOutput.match(IOS_UPDATE_ID_REGEX);
      const androidMatch = allOutput.match(ANDROID_UPDATE_ID_REGEX);
      if (iosMatch && androidMatch) {
        resolve({
          iosUpdateID: iosMatch[1].trim(),
          androidUpdateID: androidMatch[1].trim(),
        });
      } else {
        resolve();
      }
    });
  });

const copyBundlesAndGetMaps = () => {
  const bundles = fs.readdirSync(bundlesPath);
  const iosBundle = bundles.find(
    (b) => b.startsWith("ios-") && b.endsWith(".hbc")
  );
  const iosMap = bundles.find(
    (b) => b.startsWith("ios-") && b.endsWith(".map")
  );
  const androidBundle = bundles.find(
    (b) => b.startsWith("android-") && b.endsWith(".hbc")
  );
  const androidMap = bundles.find(
    (b) => b.startsWith("android-") && b.endsWith(".map")
  );
  if (!iosBundle || !iosMap) {
    throw new Error("Could not find an iOS bundle or map");
  }
  if (!androidBundle || !androidMap) {
    throw new Error("Could not find an Android bundle or map");
  }
  fs.copyFileSync(
    path.join(bundlesPath, iosBundle),
    path.join(bundlesPath, "main.jsbundle")
  );
  fs.copyFileSync(
    path.join(bundlesPath, androidBundle),
    path.join(bundlesPath, "index.android.bundle")
  );
  return { iosMap, androidMap };
};

const uploadBundlesToSentry = ({
  iosUpdateID,
  iosMap,
  androidUpdateID,
  androidMap,
  env,
}) => {
  const iosBundleId =
    env === "preview" ? "com.converse.preview" : "com.converse.native";
  const sentryIOSUploadCommand = `SENTRY_ORG=converse-app SENTRY_PROJECT=converse-react-native SENTRY_AUTH_TOKEN=eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a node_modules/@sentry/cli/bin/sentry-cli releases \
  files ${iosBundleId}@${appJson.expo.ios.version}+${appJson.expo.ios.buildNumber} \
  upload-sourcemaps \
  --dist ${iosUpdateID} \
  --rewrite \
  dist/bundles/main.jsbundle dist/bundles/${iosMap}`;
  console.log(
    `Uploading iOS bundle to Sentry (${appJson.expo.ios.version}+${appJson.expo.ios.buildNumber} - dist ${iosUpdateID})`
  );
  try {
    const result = execSync(sentryIOSUploadCommand, { cwd: rootPath });
    console.log(result.toString());
  } catch (e) {
    console.log("An error occured");
    console.log(e);
  }

  const androidBundleId =
    env === "preview" ? "com.converse.preview" : "com.converse.prod";
  const sentryAndroidUploadCommand = `SENTRY_ORG=converse-app SENTRY_PROJECT=converse-react-native SENTRY_AUTH_TOKEN=eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a node_modules/@sentry/cli/bin/sentry-cli releases \
  files ${androidBundleId}@${appJson.expo.android.version}+${appJson.expo.android.versionCode} \
  upload-sourcemaps \
  --dist ${androidUpdateID} \
  --rewrite \
  dist/bundles/index.android.bundle dist/bundles/${androidMap}`;
  console.log(
    `Uploading Android bundle to Sentry... (${appJson.expo.android.version}+${appJson.expo.android.versionCode} - dist ${androidUpdateID})`
  );
  try {
    const result = execSync(sentryAndroidUploadCommand, { cwd: rootPath });
    console.log(result.toString());
  } catch (e) {
    console.log("An error occured");
    console.log(e);
  }
};

const update = async () => {
  const questions = [
    {
      type: "select",
      name: "env",
      message: "Pick an environment",
      choices: [{ value: "preview" }, { value: "production" }],
    },
  ];
  const { env } = await prompts(questions);
  if (!env) process.exit(1);
  const { iosUpdateID, androidUpdateID } = await uploadUpdatesToExpo(env);
  const { iosMap, androidMap } = copyBundlesAndGetMaps();
  uploadBundlesToSentry({
    iosUpdateID,
    iosMap,
    androidMap,
    androidUpdateID,
    env,
  });
};

update();
