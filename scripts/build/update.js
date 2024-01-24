const { execSync } = require("child_process");
const isClean = require("git-is-clean");
const prompts = require("prompts");

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

  execSync(`node scripts/build/ios/${env}.js`);
  execSync(`node scripts/build/android/${env}.js`);
  execSync(`eas update --branch ${env}`);
};

update();
