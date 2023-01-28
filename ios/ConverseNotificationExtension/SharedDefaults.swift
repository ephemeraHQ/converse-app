import Foundation


struct SharedDefaults {
  var sharedDefaults: UserDefaults

  init() {
    let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
    let appBundleId = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
    sharedDefaults = UserDefaults(suiteName: "group.\(appBundleId)")!
  }

  func string(forKey: String) -> String? {
    return sharedDefaults.string(forKey: forKey)
  }
  
  func set(_ value: Any?, forKey defaultName: String) {
    return sharedDefaults.set(value, forKey: defaultName)
  }
}
