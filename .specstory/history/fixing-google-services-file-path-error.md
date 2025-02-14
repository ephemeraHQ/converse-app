## SpecStory

## Fixing Google Services File Path Error (2/6/2025, 10:25:48 AM)

_**User**_

help " withIosXcodeprojBaseMod: ENOENT: no such file or directory, copyfile '/Users/thierryskoda/Programming/converse-app/google-services/development.json' -> '/Users/thierryskoda/Programming/converse-app/ios/ConverseDEV/GoogleService-Info.plist'"

---

_**Assistant**_

This error occurs because the Google Services configuration file is not being found in the correct location. The issue is with how we're specifying the `googleServicesFile` path in the Expo config. For iOS, we need to specify a separate path for the iOS Google Services file (which should be a .plist file) and the Android Google Services file (which should be a .json file).

Here's how to fix it:

```typescript:app.config.ts
// ... existing code ...

type EnvironmentConfig = {
  scheme: string;
  androidPackage: string;
  appDomainConverse: string;
  appDomainGetConverse: string;
  appName: string;
  icon: string;
  googleServicesFileAndroid: string;  // Updated
  googleServicesFileIos: string;      // Added
  ios: {
    bundleIdentifier: string;
    associatedDomains: string[];
  };
  android: {
    package: string;
  };
};

const settings: Record<Environment, EnvironmentConfig> = {
  development: {
    // ... existing properties ...
    googleServicesFileAndroid: "./google-services/development.json",     // Updated
    googleServicesFileIos: "./google-services/GoogleService-Info.plist", // Added
    // ... rest of development config
  },
  preview: {
    // ... existing properties ...
    googleServicesFileAndroid: "./google-services/preview.json",              // Updated
    googleServicesFileIos: "./google-services/preview-GoogleService-Info.plist", // Added
    // ... rest of preview config
  },
  production: {
    // ... existing properties ...
    googleServicesFileAndroid: "./google-services/production.json",              // Updated
    googleServicesFileIos: "./google-services/prod-GoogleService-Info.plist",    // Added
    // ... rest of production config
  },
};

// In the ExpoConfig return object, update the ios and android sections:
    ios: {
      // ... existing ios config ...
      googleServicesFile: config.googleServicesFileIos,  // Updated
      // ... rest of ios config
    },
    android: {
      // ... existing android config ...
      googleServicesFile: config.googleServicesFileAndroid,  // Updated
      // ... rest of android config
    },
// ... existing code ...
```

You'll need to:

1. Make sure you have the correct Google Services configuration files in your project:
   - For iOS: `GoogleService-Info.plist` files for each environment
   - For Android: `.json` files for each environment

2. Place these files in your `google-services` directory with the appropriate names as specified in the config

3. Make sure the paths in the config match the actual locations and filenames of your Google Services configuration files

The error should be resolved once you have the correct .plist files in place and the paths properly configured.

---

_**User**_

instead of "googleServicesFileAndroid" and "googleServicesFileIos" add googleServicesFile" in ios and android object

---

_**Assistant**_

I'll help modify the config to move the `googleServicesFile` into the respective iOS and Android objects.

```typescript:app.config.ts
// ... existing code ...

type EnvironmentConfig = {
  scheme: string;
  androidPackage: string;
  appDomainConverse: string;
  appDomainGetConverse: string;
  appName: string;
  icon: string;
  ios: {
    bundleIdentifier: string;
    associatedDomains: string[];
    googleServicesFile: string;  // Added here
  };
  android: {
    package: string;
    googleServicesFile: string;  // Added here
  };
};

const settings: Record<Environment, EnvironmentConfig> = {
  development: {
    scheme: "converse-dev",
    ios: {
      bundleIdentifier: "com.converse.dev",
      associatedDomains: [
        "applinks:dev.converse.xyz",
        "applinks:dev.getconverse.app",
        "webcredentials:dev.converse.xyz",
      ],
      googleServicesFile: "./google-services/GoogleService-Info.plist",  // Added here
    },
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./google-services/development.json",  // Added here
    },
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
    appName: "Converse DEV",
    icon: "./assets/icon-preview.png",
  },
  preview: {
    // ... existing properties ...
    ios: {
      bundleIdentifier: "com.converse.preview",
      associatedDomains: [
        "applinks:preview.converse.xyz",
        "applinks:preview.getconverse.app",
        "webcredentials:preview.converse.xyz",
      ],
      googleServicesFile: "./google-services/preview-GoogleService-Info.plist",  // Added here
    },
    android: {
      package: "com.converse.preview",
      googleServicesFile: "./google-services/preview.json",  // Added here
    },
    // ... rest of preview config
  },
  production: {
    // ... existing properties ...
    ios: {
      bundleIdentifier: "com.converse.native",
      associatedDomains: [
        "applinks:converse.xyz",
        "applinks:getconverse.app",
        "webcredentials:converse.xyz",
      ],
      googleServicesFile: "./google-services/prod-GoogleService-Info.plist",  // Added here
    },
    android: {
      package: "com.converse.prod",
      googleServicesFile: "./google-services/production.json",  // Added here
    },
    // ... rest of production config
  },
};

// In the ExpoConfig return object, update the ios and android sections:
    ios: {
      // ... existing ios config ...
      googleServicesFile: config.ios.googleServicesFile,  // Updated
      // ... rest of ios config
    },
    android: {
      // ... existing android config ...
      googleServicesFile: config.android.googleServicesFile,  // Updated
      // ... rest of android config
    },
// ... existing code ...
```

This change moves the `googleServicesFile` configuration into the respective platform objects, making it clearer which file belongs to which platform. Make sure you have the correct Google Services configuration files in your project with the specified paths and filenames.

---

_**User**_

do i really need the file to be named "GoogleService-Info.plist" or can i be named like google-service.plist

---

_**Assistant**_

The filename "GoogleService-Info.plist" is specifically required by Firebase/Google Services for iOS. It's not just a convention - the iOS Firebase SDK specifically looks for a file with this exact name. 

If you use a different filename, even if it's a valid .plist file with the correct content, the Firebase initialization may fail. This is why it's important to keep the original filename "GoogleService-Info.plist" that you get from the Firebase Console.

You can have different versions of this file for different environments (like development, staging, production) in your source directory, but when building the app, it needs to be copied to the iOS project with the exact name "GoogleService-Info.plist".

So in your case, you should:
1. Keep the original filename "GoogleService-Info.plist"
2. You can store different versions in your google-services directory with prefixes (like you currently have with "preview-GoogleService-Info.plist" and "prod-GoogleService-Info.plist")

---

_**User**_

still get "Error: [ios.xcodeproj]: withIosXcodeprojBaseMod: ENOENT: no such file or directory, copyfile '/Users/thierryskoda/Programming/converse-app/google-services/GoogleService-Info.plist' -> '/Users/thierryskoda/Programming/converse-app/ios/ConverseDEV/GoogleService-Info.plist'"

Look at @app.config.ts  and my files are in @development.plist for example for dev

---

_**Assistant**_

I see the issue. The paths in your config don't match your actual file structure. Let's update the paths in the config to match your actual file structure where the files are in the `google-services/ios/` directory and have different names.

```typescript:app.config.ts
// ... existing code ...

const settings: Record<Environment, EnvironmentConfig> = {
  development: {
    // ... other config ...
    ios: {
      bundleIdentifier: "com.converse.dev",
      associatedDomains: [
        "applinks:dev.converse.xyz",
        "applinks:dev.getconverse.app",
        "webcredentials:dev.converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/development.plist",  // Updated path
    },
    android: {
      package: "com.converse.dev",
      googleServicesFile: "./google-services/development.json",
    },
    // ... other config ...
  },
  preview: {
    // ... other config ...
    ios: {
      bundleIdentifier: "com.converse.preview",
      associatedDomains: [
        "applinks:preview.converse.xyz",
        "applinks:preview.getconverse.app",
        "webcredentials:preview.converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/preview.plist",  // Updated path
    },
    android: {
      package: "com.converse.preview",
      googleServicesFile: "./google-services/preview.json",
    },
    // ... other config ...
  },
  production: {
    // ... other config ...
    ios: {
      bundleIdentifier: "com.converse.native",
      associatedDomains: [
        "applinks:converse.xyz",
        "applinks:getconverse.app",
        "webcredentials:converse.xyz",
      ],
      googleServicesFile: "./google-services/ios/production.plist",  // Updated path
    },
    android: {
      package: "com.converse.prod",
      googleServicesFile: "./google-services/production.json",
    },
    // ... other config ...
  },
};
// ... existing code ...
```

However, you'll still need to rename your .plist files to "GoogleService-Info.plist" as mentioned earlier. I recommend:

1. Either rename your files to "GoogleService-Info.plist" in each environment folder:
```
google-services/ios/development/GoogleService-Info.plist
google-services/ios/preview/GoogleService-Info.plist
google-services/ios/production/GoogleService-Info.plist
```

2. Or create a build script that copies and renames your .plist files to "GoogleService-Info.plist" during the build process.

The Firebase SDK specifically looks for "GoogleService-Info.plist", so this filename requirement can't be avoided.

---



---

