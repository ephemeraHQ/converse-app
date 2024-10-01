const { spawn } = require("child_process");
const prompts = require("prompts");

const DEV_URL = "converse-dev://";
const PREVIEW_URL = "converse-preview://";
const PROD_URL = "converse://";

async function openDeepLink() {
  const questions = [
    {
      type: "select",
      name: "environment",
      message: "Choose an environment:",
      choices: [
        { title: "Development", value: "dev" },
        { title: "Preview", value: "preview" },
        { title: "Production", value: "prod" },
      ],
    },
    {
      type: "select",
      name: "platform",
      message: "Choose a platform:",
      choices: [
        { title: "iOS", value: "ios" },
        { title: "Android", value: "android" },
      ],
    },
  ];

  const { environment, platform } = await prompts(questions);

  if (!environment || !platform) {
    console.log("Operation cancelled.");
    process.exit(1);
  }

  let baseUrl;
  switch (environment) {
    case "dev":
      baseUrl = DEV_URL;
      break;
    case "preview":
      baseUrl = PREVIEW_URL;
      break;
    case "prod":
      baseUrl = PROD_URL;
      break;
  }

  let params = [];
  let addMoreParams = true;

  while (addMoreParams) {
    const { wantToAddParam } = await prompts({
      type: "confirm",
      name: "wantToAddParam",
      message: "Want to add a parameter?",
      initial: true,
    });

    if (!wantToAddParam) {
      addMoreParams = false;
      break;
    }

    const { key, value } = await prompts([
      {
        type: "text",
        name: "key",
        message: "Enter parameter key:",
      },
      {
        type: "text",
        name: "value",
        message: "Enter parameter value:",
      },
    ]);

    if (key && value) {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  const fullUrl =
    params.length > 0 ? `${baseUrl}?${params.join("&")}` : baseUrl;

  try {
    await executeCommand("npx", [
      "uri-scheme",
      "open",
      fullUrl,
      `--${platform}`,
    ]);
  } catch (error) {
    console.error("Error opening deep link:", error);
  }
}

function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

openDeepLink();
