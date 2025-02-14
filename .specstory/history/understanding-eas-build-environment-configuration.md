## SpecStory

## Understanding EAS Build Environment Configuration (1/19/2025, 11:12:43 AM)

_**User**_

put comments, what is this doing

---

_**Assistant**_

I'll add comments to explain what this script does. Here's the commented version:

```javascript:scripts/build/eas.js
// Import required Node.js modules
const dotenv = require("dotenv");
const fs = require("fs");

/**
 * Handles environment configuration for EAS builds
 * This script modifies the eas.json file by injecting environment variables
 * from the appropriate .env file based on the build environment
 * 
 * @param {string} environment - The build environment ('production' or 'preview')
 */
const handleEnv = (environment) => {
  // Only proceed for 'production' or 'preview' environments
  if (environment !== "production" && environment !== "preview") return;

  // Define paths for EAS config and environment files
  const EAS_PATH = "eas.json";
  const ENV_PATH = environment === "production" ? ".env.production" : ".env";

  // Check if the environment file exists
  const hasConfig = fs.existsSync(ENV_PATH);
  if (!hasConfig) {
    throw new Error(
      `To build for ${environment} you need a ${ENV_PATH} env file in the project root`
    );
  }

  // Parse the environment file and EAS configuration
  const envConfig = dotenv.parse(fs.readFileSync(ENV_PATH));
  const easContent = JSON.parse(fs.readFileSync(EAS_PATH, "utf-8"));

  // Iterate through each build configuration in eas.json
  Object.keys(easContent.build).forEach((buildName) => {
    const buildConfig = easContent.build[buildName];
    // If the build's channel matches the target environment,
    // merge the environment variables into the build config
    if (buildConfig.channel === environment) {
      buildConfig.env = { ...buildConfig.env, ...envConfig };
    }
  });

  // Write the updated configuration back to eas.json
  fs.writeFileSync(EAS_PATH, JSON.stringify(easContent, null, 2), "utf-8");
};

// Export the handleEnv function for use in other modules
module.exports = { handleEnv };

// If this script is run directly (not imported as a module)
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args[0] !== "--env") {
    throw new Error("Only --env argument is supported");
  }
  // Execute handleEnv with the provided environment argument
  handleEnv(args[1]);
}
```

This script is used for managing environment variables in Expo Application Services (EAS) builds. Here's what it does:

1. It takes an environment parameter ('production' or 'preview') and reads the corresponding environment file (.env.production or .env)
2. It reads the eas.json configuration file which contains build settings for your Expo app
3. For each build configuration in eas.json that matches the specified environment channel, it injects the environment variables from the .env file
4. The updated configuration is then written back to eas.json
5. The script can be run directly with a --env argument or imported as a module in other files

This is typically used in the build process to ensure that the correct environment variables are available during EAS builds for different environments (production vs preview).

---



---

