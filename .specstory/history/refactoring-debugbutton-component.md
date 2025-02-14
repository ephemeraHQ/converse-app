## SpecStory

## Refactoring DebugButton Component (2/12/2025, 9:55:56 AM)

_**User**_

remove the ref from forawrd ref and just create a new one

---

_**Assistant**_

I'll help modify the DebugButton component to use a local ref instead of forwarding it. Here's how we can update the code:

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
import { useCallback, useRef } from "react";
import { Alert, Platform } from "react-native";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { useLogout } from "@/utils/logout";

export function DebugButton() {
  const { logout } = useLogout();
  const debugRef = useRef<{ showDebugMenu?: () => void }>(null);
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;

  const showDebugMenu = useCallback(() => {
    if (!debugRef.current || !debugRef.current.showDebugMenu) {
      return;
    }
    debugRef.current.showDebugMenu();
  }, []);

  // ... rest of the existing code ...
  const debugMethods = {
    // ... existing debug methods ...
  };

  debugRef.current = {
    showDebugMenu() {
      const methods: any = {
        ...debugMethods,
        "Share current session logs": async () => {
          Share.open({
            title: translate("debug.converse_log_session"),
            url: `file://${loggingFilePath}`,
            type: "text/plain",
          });
        },
        // ... rest of the methods ...
        Cancel: undefined,
      };
      const options = Object.keys(methods);

      showActionSheetWithOptions(
        {
          title: `Converse v${appVersion} (${buildNumber})`,
          options,
          cancelButtonIndex: options.indexOf("Cancel"),
        },
        (selectedIndex?: number) => {
          if (selectedIndex === undefined) return;
          const method = methods[options[selectedIndex]];
          if (method) {
            method();
          }
        }
      );
    },
  };

  return null;
}
```

Key changes made:
1. Removed `forwardRef` and `useImperativeHandle`
2. Created a local `useRef` hook to store the debug menu functionality
3. Added missing imports for `useCallback` and `useRef`
4. Changed the component to a regular function component
5. Moved the debug menu functionality to be stored directly in the ref

The component now manages its own ref internally rather than receiving it as a prop. The functionality remains the same, but the implementation is simpler and fixes the linter errors.

Note that if you need to access the debug menu from a parent component, you'll need to expose a method to do so, or use a different pattern like context or event emitter.

---



---

