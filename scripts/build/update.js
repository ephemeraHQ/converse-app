const { spawn } = require("child_process");
const isClean = require("git-is-clean");
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

  await executeCommand("node", [`scripts/build/ios/${env}.js`]);
  await executeCommand("node", [`scripts/build/android/${env}.js`]);
  await executeCommand("eas", ["update", "--branch", env]);
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
