const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const plist = require("plist");
const prompts = require("prompts");

const IOS_UPDATE_ID_REGEX = /iOS update ID\s*(.*)/;
const ANDROID_UPDATE_ID_REGEX = /Android update ID\s*(.*)/;

const rootPath = path.join(__dirname, "../..");
const bundlesPath = path.join(__dirname, "../../dist/bundles");
const infoPlistPath = path.join(__dirname, "../../ios/Converse/Info.plist");
const buildGradlePath = path.join(__dirname, "../../android/app/build.gradle");

const GRADLE_VERSION_NAME_REGEX = /versionName "(.*?)"/;
const GRADLE_VERSION_CODE_REGEX = /versionCode ([0-9]*)/;

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
  const iOSPlistData = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));
  const androidBuildGradle = fs.readFileSync(buildGradlePath, "utf8");
  const sentryIOSUploadCommand = `SENTRY_ORG=converse-app SENTRY_PROJECT=converse-react-native SENTRY_AUTH_TOKEN=eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a node_modules/@sentry/cli/bin/sentry-cli releases \
  files ${iosBundleId}@${iOSPlistData.CFBundleShortVersionString}+${iOSPlistData.CFBundleVersion} \
  upload-sourcemaps \
  --dist ${iosUpdateID} \
  --rewrite \
  dist/bundles/main.jsbundle dist/bundles/${iosMap}`;
  console.log(
    `Uploading iOS bundle to Sentry (${iOSPlistData.CFBundleShortVersionString}+${iOSPlistData.CFBundleVersion} - dist ${iosUpdateID})`
  );
  try {
    const result = execSync(sentryIOSUploadCommand, { cwd: rootPath });
    console.log(result.toString());
  } catch (e) {
    console.log("An error occured");
    console.log(e);
  }
  const androidVersionMatch = androidBuildGradle.match(
    GRADLE_VERSION_NAME_REGEX
  );
  const androidVersionCodeMatch = androidBuildGradle.match(
    GRADLE_VERSION_CODE_REGEX
  );
  const androidBundleId =
    env === "preview" ? "com.converse.preview" : "com.converse.prod";
  const sentryAndroidUploadCommand = `SENTRY_ORG=converse-app SENTRY_PROJECT=converse-react-native SENTRY_AUTH_TOKEN=eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a node_modules/@sentry/cli/bin/sentry-cli releases \
  files ${androidBundleId}@${androidVersionMatch[1].trim()}+${androidVersionCodeMatch[1].trim()} \
  upload-sourcemaps \
  --dist ${androidUpdateID} \
  --rewrite \
  dist/bundles/index.android.bundle dist/bundles/${androidMap}`;
  console.log(
    `Uploading Android bundle to Sentry... (${androidVersionMatch[1].trim()}+${androidVersionCodeMatch[1].trim()} - dist ${androidUpdateID})`
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
