const { spawn, execSync } = require("child_process");
const isClean = require("git-is-clean");
const path = require("path");
const prompts = require("prompts");

const appJson = require("../../app.json");

// eslint-disable-next-line no-undef
const PROJECT_ROOT = path.join(__dirname, "..", "..");

const build = async () => {
  const isAdvanced = process.argv.includes("--advanced");
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
  if (env !== "development") {
    const clean = await isClean();
    if (!clean) {
      const { acceptGitNotClean } = await prompts([
        {
          type: "select",
          name: "acceptGitNotClean",
          message: `Git index not clean. Proceed? (Your git index will be reset at the end!)`,
          choices: [{ value: "no" }, { value: "yes" }],
        },
      ]);
      if (acceptGitNotClean !== "yes") {
        process.exit(1);
      }
    }
  }
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
    const { typecheck } = await prompts([
      {
        type: "select",
        name: "typecheck",
        message: `Typecheck?`,
        choices: [{ value: "no" }, { value: "yes" }],
      },
    ]);
    if (typecheck === "yes") {
      await executeCommand("yarn", ["typecheck"]);
    }
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
    if (isAdvanced) {
      const { interactive } = await prompts([
        {
          type: "select",
          name: "interactive",
          message: `Build interactive?`,
          choices: [{ value: "no" }, { value: "yes" }],
        },
      ]);
      if (interactive === "no") {
        buildArgs.push("--non-interactive");
      }
    } else {
      buildArgs.push("--non-interactive");
    }
  }

  let keepLogs = false;

  if (buildLocally) {
    if (isAdvanced) {
      const { skipCleanup } = await prompts([
        {
          type: "select",
          name: "skipCleanup",
          message: "Force keep logs to debug failing build?",
          choices: [{ value: "no" }, { value: "yes" }],
        },
      ]);
      if (skipCleanup === "yes") {
        keepLogs = true;
      }
    }
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
    const env = {
      ...process.env,
    };
    if (keepLogs) {
      env.EAS_LOCAL_BUILD_SKIP_CLEANUP = 1;
    }
    await executeCommand(buildCommand, buildArgs, env);
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
    execSync("git restore ios/Converse/Supporting/Expo.plist", {
      cwd: PROJECT_ROOT,
    });
    execSync("git restore android/app/src/main/res/values/strings.xml", {
      cwd: PROJECT_ROOT,
    });
  }
};

const executeCommand = (command, args, env) =>
  new Promise((resolve, reject) => {
    console.log(`${command} ${args.join(" ")}`);
    const buildProcess = spawn(command, args, {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      env,
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
