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
      "PRODUCT_BUNDLE_IDENTIFIER = com.converse.preview"
    )
    .replace(
      /com\.converse\.dev AdHoc 1672231603936/g,
      "com.converse.preview AdHoc 1671190919466"
    )
    .replace(
      /com\.converse\.dev\.ConverseNotificationExtension AdHoc 1672234281727/g,
      "com.converse.preview.ConverseNotificationExtension AdHoc 1672247337689"
    );

  fs.writeFileSync(PROJ_PATH, newProjContent);

  const PLIST_PATH = "ios/Converse/Info.plist";

  const info = plist.parse(fs.readFileSync(PLIST_PATH, "utf8"));
  info.CFBundleDisplayName = "Converse PREVIEW";
  info.CFBundleURLSchemes = ["converse-preview", "com.converse.preview"];
  const newInfo = plist.build(info);
  fs.writeFileSync(PLIST_PATH, newInfo, "utf-8");
};

go();
