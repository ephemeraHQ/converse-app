import { useActionSheet } from "@expo/react-native-action-sheet";
import Constants from "expo-constants";
import { useContext } from "react";
import { Button, View } from "react-native";

import config from "../config";
import { clearDB } from "../data/db";
import dataSource from "../data/db/datasource";
import { Conversation } from "../data/db/entities/conversation";
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
            "Show logs": () => {
              alert(logs.join("\n"));
            },
            "Show state": () => {
              alert(JSON.stringify(state, null, 2));
            },
            "Show db": async () => {
              const convosInDb = await dataSource
                .getRepository(Conversation)
                .count();
              alert(JSON.stringify({ convosCount: convosInDb }, null, 2));
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
              if (!selectedIndex) return;
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
