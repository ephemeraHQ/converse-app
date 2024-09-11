const { execSync } = require("child_process");
const fs = require("fs");

const runProd = async () => {
  const args = process.argv.slice(2);
  const debug = args.includes("--debug");

  if (!fs.existsSync(".env.production")) {
    throw new Error(".env.production is required to run prod locally");
  }
  if (fs.existsSync(".env")) {
    throw new Error(
      ".env should be renamed .env.development so it's not merged with .env.production values"
    );
  }

  const commandEnv = {
    ...process.env,
    EXPO_ENV: "production",
    NODE_ENV: "production",
  };

  if (debug) {
    execSync("npx expo start", {
      stdio: "inherit",
      env: { ...commandEnv, DEBUG_PROD_LOGS: true },
    });
  } else {
    execSync("npx expo start --no-dev", {
      stdio: "inherit",
      env: commandEnv,
    });
  }
};

runProd();
