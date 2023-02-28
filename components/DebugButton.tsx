import { useActionSheet } from "@expo/react-native-action-sheet";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";

import config from "../config";
import { clearDB } from "../data/db";

const logs: string[] = [];

export const addLog = (log: string) => {
  logs.push(log);
};

const DebugButton = forwardRef((props, ref) => {
  const { showActionSheetWithOptions } = useActionSheet();
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
        "Clear DB": clearDB,
        "Is hermes": () => {
          const isHermes = () => (global as any).HermesInternal != null;
          alert(isHermes() ? "yes" : "no");
        },
        "Update app": async () => {
          try {
            const update = await Updates.fetchUpdateAsync();
            if (update.isNew) {
              await Updates.reloadAsync();
            } else {
              alert("No new update");
            }
          } catch (error) {
            alert(error);
            console.error(error);
          }
        },
        "Show logs": () => {
          alert(logs.join("\n"));
        },
        "Copy logs": () => {
          Clipboard.setStringAsync(logs.join("\n"));
          alert("Copied!");
        },
        "Show config": () => {
          alert(
            JSON.stringify(
              {
                expoEnv: Constants.expoConfig?.extra?.ENV,
                config,
                version: Constants.manifest?.version,
                releaseChannel: Constants.manifest?.releaseChannel,
                build: Constants.manifest?.ios?.buildNumber,
                releaseId: Constants.manifest2?.id,
              },
              null,
              2
            )
          );
        },
        Cancel: undefined,
      };
      const options = Object.keys(methods);

      showActionSheetWithOptions(
        {
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
  }));

  return null;
});

export default DebugButton;
