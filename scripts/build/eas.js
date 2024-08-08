const dotenv = require("dotenv");
const fs = require("fs");

const handleEnv = (environment) => {
  if (environment !== "production" && environment !== "preview") return;
  const EAS_PATH = "eas.json";
  const ENV_PATH = environment === "production" ? ".env.production" : ".env";
  const hasConfig = fs.existsSync(ENV_PATH);
  if (!hasConfig) {
    throw new Error(
      `To build for ${environment} you need a ${ENV_PATH} env file in the project root`
    );
  }
  const envConfig = dotenv.parse(fs.readFileSync(ENV_PATH));
  const easContent = JSON.parse(fs.readFileSync(EAS_PATH, "utf-8"));
  Object.keys(easContent.build).forEach((buildName) => {
    const buildConfig = easContent.build[buildName];
    if (buildConfig.channel === environment) {
      buildConfig.env = { ...buildConfig.env, ...envConfig };
    }
  });
  fs.writeFileSync(EAS_PATH, JSON.stringify(easContent, null, 2), "utf-8");
};

module.exports = { handleEnv };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] !== "--env") {
    throw new Error("Only --env argument is supported");
  }
  handleEnv(args[1]);
}
