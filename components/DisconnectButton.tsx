import { useActionSheet } from "@expo/react-native-action-sheet";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useContext } from "react";
import { View, Button } from "react-native";

import { clearDB } from "../data/db";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import {
  disablePushNotifications,
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { shortAddress } from "../utils/str";
import { sendMessageToWebview } from "./XmtpWebview";

export default function DisconnectButton() {
  const { state, dispatch } = useContext(AppContext);
  const { showActionSheetWithOptions } = useActionSheet();
  return (
    <View style={{ marginLeft: -8 }}>
      <Button
        onPress={() => {
          const methods = {
            "Copy wallet address": () => {
              Clipboard.setStringAsync(state.xmtp.address || "");
            },
            "Turn on notifications": () => {
              if (state.notifications.status === "denied") {
                // Open settings
                Linking.openSettings();
              } else if (state.notifications.status === "undetermined") {
                // Open popup
                requestPushNotificationsPermissions().then(
                  (newStatus: NotificationPermissionStatus | undefined) => {
                    if (!newStatus) return;
                    dispatch({
                      type: NotificationsDispatchTypes.NotificationsStatus,
                      payload: { status: newStatus },
                    });
                  }
                );
              }
            },
            Disconnect: () => {
              clearDB();
              disablePushNotifications();
              sendMessageToWebview("DISCONNECT");
            },
            Cancel: () => {},
          };

          const options = Object.keys(methods);
          if (state.notifications.status === "granted") {
            options.splice(options.indexOf("Turn on notifications"), 1);
          }

          showActionSheetWithOptions(
            {
              options,
              destructiveButtonIndex: options.indexOf("Disconnect"),
              cancelButtonIndex: options.indexOf("Cancel"),
              title: state.xmtp.address,
            },
            (selectedIndex?: number) => {
              if (selectedIndex === undefined) return;
              const method = methods[options[selectedIndex]];
              if (method) {
                method();
              }
            }
          );
        }}
        title={shortAddress(state.xmtp.address || "")}
      />
    </View>
  );
}
