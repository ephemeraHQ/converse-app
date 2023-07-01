const { spawn, execSync } = require("child_process");
const path = require("path");
const prompts = require("prompts");

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
      choices: [{ value: "EAS" }, { value: "local" }],
    },
  ];
  const { platform, env, local } = await prompts(questions);

  const buildCommand = "eas";
  const buildProfile = env === "production" ? `production-${platform}` : env;
  const buildArgs = [
    "build",
    "--profile",
    buildProfile,
    "--platform",
    platform,
  ];

  if (env === "production") {
    await executeCommand("yarn", ["typecheck"]);
  }

  if (env === "preview" || env === "production") {
    await executeCommand("node", [`scripts/build/${platform}/${env}.js`]);
  }

  if (local === "local") {
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

  await executeCommand(buildCommand, buildArgs);

  if (env === "production" && local === "local") {
    const submitCommand = "eas";
    const submitArgs = [
      "submit",
      "--profile",
      "production",
      "--platform",
      platform,
    ];

    await executeCommand(submitCommand, submitArgs);
  }

  if (env === "preview") {
    execSync("git co -f", { cwd: PROJECT_ROOT });
  } else if (env === "production") {
    execSync("git add app.json", { cwd: PROJECT_ROOT });
    if (platform === "ios") {
      execSync("git restore .", { cwd: PROJECT_ROOT });
    } else {
      execSync("git restore --staged --worktree android", {
        cwd: PROJECT_ROOT,
      });
    }
  }
};

const executeCommand = (command, args) =>
  new Promise((resolve, reject) => {
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
