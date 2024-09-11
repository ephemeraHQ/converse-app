const { execSync } = require("child_process");
const fs = require("fs");

const runProd = async () => {
  if (!fs.existsSync(".env.production")) {
    throw new Error(".env.production is required to run prod locally");
  }
  if (fs.existsSync(".env")) {
    throw new Error(
      ".env should be renamed .env.development so it's not merged with .env.production values"
    );
  }

  execSync("npx expo start --clear --no-dev", { stdio: "inherit" });
};

runProd();
