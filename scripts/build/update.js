const { spawn } = require("child_process");
const isClean = require("git-is-clean");
const path = require("path");
const prompts = require("prompts");

// eslint-disable-next-line no-undef
const PROJECT_ROOT = path.join(__dirname, "..", "..");

const update = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index not clean");
    process.exit(1);
  }
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

  try {
    await executeCommand("node", [`scripts/build/ios/${env}.js`]);
    await executeCommand("node", [`scripts/build/android/${env}.js`]);
    const updateEnv = { ...process.env };
    if (env === "preview") {
      updateEnv.EXPO_ENV = "preview";
    }
    await executeCommand("eas", ["update", "--branch", env], updateEnv);
    await executeCommand("npx", ["sentry-expo-upload-sourcemaps", "dist"], {
      ...process.env,
      SENTRY_ORG: "converse-app",
      SENTRY_PROJECT: "converse-react-native",
      SENTRY_AUTH_TOKEN:
        "eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a",
    });
  } catch (e) {
    console.error(e);
  }
  await executeCommand("git", ["checkout", "-f"]);
};

update();

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
