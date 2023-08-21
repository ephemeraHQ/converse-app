const { spawn, execSync } = require("child_process");
const path = require("path");
const prompts = require("prompts");

const appJson = require("../../app.json");

// eslint-disable-next-line no-undef
const PROJECT_ROOT = path.join(__dirname, "..", "..");

const build = async () => {
  const questions = [
    {
      type: "select",
      name: "platform",
      message: "Pick a platform",
      choices: [
        { title: "iOS", value: "ios" },
        { title: "Android", value: "android" },
      ],
    },
    {
      type: "select",
      name: "env",
      message: "Pick an environment",
      choices: [
        { value: "development" },
        { value: "preview" },
        { value: "production" },
      ],
    },
    {
      type: "select",
      name: "local",
      message: "Build locally or on EAS servers?",
      choices: [
        { title: "locally", value: "local" },
        { value: "on EAS servers" },
      ],
    },
  ];
  const { platform, env, local } = await prompts(questions);
  if (!platform || !env || !local) process.exit(1);
  const buildLocally = local === "local";

  const buildCommand = "eas";
  const buildProfile = env === "production" ? `production-${platform}` : env;
  const buildArgs = [
    "build",
    "--profile",
    buildProfile,
    "--platform",
    platform,
  ];

  const iosVersion = appJson.expo.ios.version;
  const androidVersion = appJson.expo.android.version;
  if (iosVersion !== androidVersion) {
    throw new Error("app.json iOS & Android version mismatch");
  }

  if (env === "production") {
    await executeCommand("yarn", ["typecheck"]);
    const tagName = `v${iosVersion}`;
    const { pushTag } = await prompts([
      {
        type: "select",
        name: "pushTag",
        message: `Push tag ${tagName} to Github?`,
        choices: [{ value: "no" }, { value: "yes" }],
      },
    ]);
    if (pushTag === "yes") {
      await executeCommand("git", ["tag", "--force", tagName]);
      await executeCommand("git", ["push", "origin", tagName, "--force"]);
    }
  }

  if (env === "preview" || env === "production") {
    await executeCommand("node", [`scripts/build/${platform}/${env}.js`]);
  }

  if (platform === "ios" && ["development", "preview"].includes(env)) {
    buildArgs.push("--non-interactive");
  }

  if (buildLocally) {
    const currentCommit = execSync('git show --format="%h" --no-patch', {
      cwd: PROJECT_ROOT,
    })
      .toString()
      .trim();
    const fileExtension =
      platform === "ios" ? "ipa" : env === "production" ? "aab" : "apk";
    buildArgs.push(
      "--local",
      "--output",
      `./builds/${platform}-${env}-${currentCommit}.${fileExtension}`
    );
  } else if (env === "production") {
    buildArgs.push("--auto-submit");
  }

  let buildSuccess = false;

  try {
    await executeCommand(buildCommand, buildArgs);
    buildSuccess = true;
  } catch (e) {
    console.log("Error during build");
    console.log(e);
  }

  if (env === "production" && buildLocally && buildSuccess) {
    const submitCommand = "eas";
    const submitArgs = [
      "submit",
      "--profile",
      "production",
      "--platform",
      platform,
    ];

    try {
      await executeCommand(submitCommand, submitArgs);
    } catch (e) {
      console.log("Error during submission");
      console.log(e);
    }
  }

  if (env === "production" || env === "preview") {
    execSync("git add app.json", { cwd: PROJECT_ROOT });
    if (platform === "ios") {
      execSync("git restore .", { cwd: PROJECT_ROOT });
    } else {
      execSync("git restore --staged --worktree android", {
        cwd: PROJECT_ROOT,
      });
    }
  } else if (env === "dev") {
    execSync("git restore ios/Converse/Supporting/Expo.plist", { cwd: PROJECT_ROOT });
    execSync("git restore android/app/src/main/res/values/strings.xml", { cwd: PROJECT_ROOT });
  }
};

const executeCommand = (command, args) =>
  new Promise((resolve, reject) => {
    console.log(`${command} ${args.join(" ")}`);
    const buildProcess = spawn(command, args, {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });

    buildProcess.on("error", (error) => {
      console.error(`Error: ${error}`);
    });

    buildProcess.on("exit", (code) => {
      if (code === 0) {
        return resolve();
      }

      reject(code);
    });
  });

build();
