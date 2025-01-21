const { withXcodeProject } = require("@expo/config-plugins");

const extensionName = "ConverseNotificationExtension";
const extensionBundleId = "com.converse.dev.notification";
const productType = "com.apple.product-type.app-extension";

const withConverseNotificationExtension = (config) => {
  return withXcodeProject(config, (newConfig) => {
    const project = newConfig.modResults;

    if (!project) {
      throw new Error("Xcode project not found");
    }
    // 3. Create a new group (optional)
    const extensionGroup = project.addPbxGroup(
      [
        "NotificationService.swift",
        "ConverseNotificationExtension.swift",
        "Datatypes.swift",
        "Info.plist",
        "KeyChain.swift",
        "MMKV.swift",
        "NotificationService.swift",
        "NotificationUtils.swift",
        "Profile.swift",
        "Sentry.swift",
        "SharedDefaults.swift",
        "Spam.swift",
        "Utils.swift",
      ],
      extensionName,
      extensionName
    );
    const groups = project.hash.project.objects["PBXGroup"];
    const mainGroupKey = Object.keys(groups).find(
      (key) => groups[key].isa === "PBXGroup" && !groups[key].name
    );
    project.addToPbxGroup(extensionGroup.uuid, mainGroupKey);

    // 1. Create a new target
    const extensionTarget = project.addTarget(
      extensionName,
      "app_extension",
      extensionBundleId,
      productType
    );
    console.log("extensionTarget", extensionTarget);

    // 2. Add build phases
    project.addBuildPhase(
      [],
      "PBXSourcesBuildPhase",
      "Sources",
      extensionTarget.uuid
    );
    project.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      extensionTarget.uuid
    );
    project.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      extensionTarget.uuid
    );

    // 4. Add a new Swift file to the extension
    project.addSourceFile(
      "NotificationService.swift",
      { target: extensionTarget.uuid },
      extensionGroup.uuid
    );

    return newConfig;
  });
};

const withServiceExtensionIos = (config, props) => {
  console.log("withServiceExtensionIos");
  config = withConverseNotificationExtension(config, props);
  console.log("Updated withServiceExtensionIos");
  return config;
};

module.exports = withServiceExtensionIos;
