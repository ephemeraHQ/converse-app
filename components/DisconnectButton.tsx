import { useActionSheet } from "@expo/react-native-action-sheet";
import * as Linking from "expo-linking";
import { useContext } from "react";
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
          const destructiveButtonIndex = 0;
          let cancelButtonIndex = 1;
          let options = ["Disconnect", "Cancel"];
          let notificationsButton = -1;

          if (state.notifications.status !== "granted") {
            cancelButtonIndex = 2;
            notificationsButton = 1;
            options = ["Disconnect", "Turn on notifications", "Cancel"];
          }

          showActionSheetWithOptions(
            {
              options,
              cancelButtonIndex,
              destructiveButtonIndex,
              title: state.xmtp.address,
            },
            (selectedIndex?: number) => {
              switch (selectedIndex) {
                case destructiveButtonIndex: {
                  clearDB();
                  disablePushNotifications();
                  sendMessageToWebview("DISCONNECT");
                  break;
                }

                case notificationsButton: {
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
                  break;
                }

                default:
                  break;
              }
            }
          );
        }}
        title={shortAddress(state.xmtp.address || "")}
      />
    </View>
  );
}
