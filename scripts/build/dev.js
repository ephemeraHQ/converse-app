const fs = require("fs");
const isClean = require("git-is-clean");
const plist = require("plist");

const go = async () => {
  const clean = await isClean();
  if (!clean) {
    console.log("Git index is not clean");
    process.exit(1);
  }

  const PROJ_PATH = "ios/Converse.xcodeproj/project.pbxproj";
  const projContent = fs.readFileSync(PROJ_PATH, "utf-8");

  const newProjContent = projContent
    .replace(
      /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.native/g,
      "PRODUCT_BUNDLE_IDENTIFIER = com.converse.dev"
    )
    .replace(
      /com\.converse\.native AppStore 2022-12-08T13:34:24\.744Z/g,
      "com.converse.dev AdHoc 1672231603936"
    )
    .replace(
      /ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon/g,
      "ASSETCATALOG_COMPILER_APPICON_NAME = AppIconPreview"
    );

  fs.writeFileSync(PROJ_PATH, newProjContent);

  const PLIST_PATH = "ios/Converse/Info.plist";

  const info = plist.parse(fs.readFileSync(PLIST_PATH, "utf8"));
  info.CFBundleDisplayName = "Converse DEV";
  info.CFBundleURLSchemes = ["converse-dev", "com.converse.dev"];
  const newInfo = plist.build(info);
  fs.writeFileSync(PLIST_PATH, newInfo, "utf-8");
};

go();
