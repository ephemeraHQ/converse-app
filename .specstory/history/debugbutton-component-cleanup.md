## SpecStory

## DebugButton Component Cleanup (2/12/2025, 9:59:02 AM)

_**User**_

clean this up, if feel the debugRef is overkill. Don't need a ref here

---

_**Assistant**_

I'll help clean up the DebugButton component by removing the unnecessary ref pattern and simplifying the code. The debug menu functionality can be implemented directly as a function within the component.

Here's the cleaned up version:

```typescript:components/DebugButton.tsx
import { translate } from "@/i18n";
import { getNativeLogFile } from "@/utils/xmtpRN/logs";
import * as Sentry from "@sentry/react-native";
import {
  getPreviousSessionLoggingFile,
  loggingFilePath,
  rotateLoggingFile,
} from "@utils/logger";
import { navigate } from "@utils/navigation";
import Share from "@utils/share";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { useLogout } from "@/utils/logout";
import { converseEventEmitter } from "@/utils/events";

export function DebugButton() {
  const { logout } = useLogout();
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;

  const showDebugMenu = useCallback(() => {
    const debugMethods = {
      Logout: async () => {
        try {
          await logout();
        } catch (error) {
          alert(error);
        }
      },
      "Trigger OTA Update": async () => {
        try {
          const update = await Updates.fetchUpdateAsync();
          if (update.isNew) {
            await Updates.reloadAsync();
          } else {
            alert("No new update");
          }
        } catch (error) {
          alert(error);
        }
      },
      "Sentry JS error": () => {
        throw new Error("My first Sentry error!");
      },
      "Sentry Native error": () => {
        Sentry.nativeCrash();
      },
      "Clear expo image cache": async () => {
        await Image.clearDiskCache();
        await Image.clearMemoryCache();
        alert("Done!");
      },
      "Clear converse media cache": async () => {
        const RNFS = require("react-native-fs");
        await RNFS.unlink(
          `file://${RNFS.CachesDirectoryPath}${
            RNFS.CachesDirectoryPath.endsWith("/") ? "" : "/"
          }mediacache`
        );
        alert("Done!");
      },
      "Share current session logs": async () => {
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${loggingFilePath}`,
          type: "text/plain",
        });
      },
      "Share native logs": async () => {
        const nativeLogFilePath = await getNativeLogFile();
        Share.open({
          title: translate("debug.libxmtp_log_session"),
          url: `file://${nativeLogFilePath}`,
          type: "text/plain",
        });
      },
      "Share previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile();
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found");
        }
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${previousLoggingFile}`,
          type: "text/plain",
        });
      },
      "New log session": rotateLoggingFile,
      "Display current session logs": async () => {
        navigate("WebviewPreview", { uri: loggingFilePath });
      },
      "Display native logs": async () => {
        const nativeLogFilePath = await getNativeLogFile();
        navigate("WebviewPreview", { uri: nativeLogFilePath });
      },
      "Display previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile();
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found");
        }
        navigate("WebviewPreview", { uri: previousLoggingFile });
      },
      Cancel: undefined,
    };

    const options = Object.keys(debugMethods);

    showActionSheetWithOptions(
      {
        title: `Converse v${appVersion} (${buildNumber})`,
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = debugMethods[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [appVersion, buildNumber, logout]);

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => {
      converseEventEmitter.off("showDebugMenu", showDebugMenu);
    };
  }, [showDebugMenu]);

  return null;
}
```

Key changes made:
1. Removed the unnecessary `debugRef` and its associated logic
2. Moved the debug menu functionality directly into the `showDebugMenu` callback
3. Moved the debug methods inside the callback to have access to the component's scope
4. Added proper dependencies to the `useCallback` hook
5. Simplified the overall structure while maintaining all functionality

The component now has a cleaner implementation while providing the same debug menu functionality through the event emitter.

---



---

