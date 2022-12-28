const isClean = require("git-is-clean");
const fs = require("fs");

const go = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index is not clean");
    process.exit(1);
  }

  const PROJ_PATH = "ios/Converse.xcodeproj/project.pbxproj";
  const content = fs.readFileSync(PROJ_PATH).toString();

  const result = content.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.native/g,
    "PRODUCT_BUNDLE_IDENTIFIER = com.converse.preview"
  );

  fs.writeFileSync(PROJ_PATH, result);
};

go();
