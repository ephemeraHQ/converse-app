import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { forwardRef, useContext, useImperativeHandle } from "react";
import * as Sentry from "sentry-expo";

import config from "../config";
import { clearDB } from "../data/db";
import { AppContext, StateType } from "../data/store/context";
import { deleteXmtpKeys } from "../utils/keychain";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

const logs: string[] = [];

export const addLog = (log: string) => {
  logs.push(log);
};

export const shouldShowDebug = (state: StateType) =>
  config.debugMenu || config.debugAddresses.includes(state.xmtp.address || "");

const DebugButton = forwardRef((props, ref) => {
  const { state } = useContext(AppContext);
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
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
        "Clear DB": clearDB,
        "Delete XMTP Key": deleteXmtpKeys,
        "Sentry JS error": () => {
          throw new Error("My first Sentry error!");
        },
        "Sentry Native error": () => {
          Sentry.Native.nativeCrash();
        },
        "Show logs": () => {
          alert(logs.join("\n"));
        },
        "Copy logs": () => {
          Clipboard.setStringAsync(logs.join("\n"));
          alert("Copied!");
        },
        "Copy profiles": () => {
          Clipboard.setStringAsync(JSON.stringify(state.profiles));
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
