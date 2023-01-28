import Foundation


struct SharedDefaults {
  var sharedDefaults: UserDefaults

  init() {
    let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
    let appBundleId = extensionBundleID.replacingOccurrences(of: "ConverseNotificationExtension", with: "")
    print("appBundleId", appBundleId)
    sharedDefaults = UserDefaults(suiteName: "group.\(appBundleId)")!
  }

  func string(forKey: String) throws -> String? {
    return sharedDefaults.string(forKey: forKey)
  }
}
