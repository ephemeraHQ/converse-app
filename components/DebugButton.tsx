import { useActionSheet } from "@expo/react-native-action-sheet";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useContext } from "react";
import { Button, View } from "react-native";

import config from "../config";
import { clearDB } from "../data/db";
import { AppContext } from "../data/store/context";

const logs: string[] = [];

export const addLog = (log: string) => {
  logs.push(log);
};

export default function DebugButton() {
  const { state } = useContext(AppContext);
  const { showActionSheetWithOptions } = useActionSheet();
  return (
    <View style={{ marginLeft: -8 }}>
      <Button
        onPress={() => {
          const methods: any = {
            "Clear DB": clearDB,
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
            "Show state": () => {
              alert(JSON.stringify(state, null, 2));
            },
            "Show config": () => {
              alert(
                JSON.stringify(
                  {
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
              const method = methods[options[selectedIndex]];
              if (method) {
                method();
              }
            }
          );
        }}
        title="DEBUG"
      />
    </View>
  );
}
