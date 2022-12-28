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
      /PRODUCT_BUNDLE_IDENTIFIER = com\.converse\.dev/g,
      "PRODUCT_BUNDLE_IDENTIFIER = com.converse.native"
    )
    .replace(
      /com\.converse\.dev AdHoc 1672231603936/g,
      "com.converse.native AppStore 2022-12-08T13:34:24.744Z"
    )
    .replace(
      /ASSETCATALOG_COMPILER_APPICON_NAME = AppIconPreview/g,
      "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon"
    );

  fs.writeFileSync(PROJ_PATH, newProjContent);

  const PLIST_PATH = "ios/Converse/Info.plist";

  const info = plist.parse(fs.readFileSync(PLIST_PATH, "utf8"));
  info.CFBundleDisplayName = "Converse";
  info.CFBundleURLSchemes = ["converse", "com.converse.native"];
  const newInfo = plist.build(info);
  fs.writeFileSync(PLIST_PATH, newInfo, "utf-8");
};

go();
