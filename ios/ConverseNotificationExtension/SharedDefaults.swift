import Foundation


struct SharedDefaults {
  var sharedDefaults: UserDefaults

  init() throws {
    sharedDefaults = UserDefaults(suiteName: "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))")!
  }

  func string(forKey: String) -> String? {
    return sharedDefaults.string(forKey: forKey)
  }
  
  func set(_ value: Any?, forKey defaultName: String) {
    return sharedDefaults.set(value, forKey: defaultName)
  }
}
