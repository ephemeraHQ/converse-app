import { useActionSheet } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback, useContext } from "react";
import { Platform, TouchableOpacity, useColorScheme, View } from "react-native";

import { clearDB } from "../data/db";
import { AppDispatchTypes } from "../data/store/appReducer";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { textSecondaryColor } from "../utils/colors";
import {
  disablePushNotifications,
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { getTitleFontScale, shortAddress } from "../utils/str";
import Button from "./Button/Button";
import Picto from "./Picto/Picto";
import { sendMessageToWebview } from "./XmtpWebview";

export default function SettingsButton() {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const onPress = useCallback(() => {
    const methods = {
      "Copy wallet address": () => {
        Clipboard.setStringAsync(state.xmtp.address || "");
      },
      "Turn on notifications": () => {
        if (state.notifications.status === "denied") {
          if (Platform.OS === "android") {
            // Android 13 is always denied first so let's try to show
            requestPushNotificationsPermissions().then(
              (newStatus: NotificationPermissionStatus | undefined) => {
                if (newStatus === "denied") {
                  Linking.openSettings();
                } else if (newStatus) {
                  dispatch({
                    type: NotificationsDispatchTypes.NotificationsStatus,
                    payload: { status: newStatus },
                  });
                }
              }
            );
          } else {
            Linking.openSettings();
          }
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
        dispatch({
          type: AppDispatchTypes.AppSetDemoAccount,
          payload: { isDemoAccount: false },
        });
        AsyncStorage.clear();
        setTimeout(() => {
          dispatch({
            type: NotificationsDispatchTypes.NotificationsShowScreen,
            payload: {
              show: true,
            },
          });
        }, 500);
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
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [
    dispatch,
    showActionSheetWithOptions,
    state.notifications.status,
    state.xmtp.address,
  ]);

  if (Platform.OS === "ios") {
    return (
      <View>
        <Button
          variant="text"
          allowFontScaling={false}
          textStyle={{ fontSize: 17 * getTitleFontScale() }}
          onPress={onPress}
          title={shortAddress(state.xmtp.address || "")}
        />
      </View>
    );
  } else {
    return (
      <TouchableOpacity onPress={onPress}>
        <Picto
          picto="account_circle"
          size={24}
          style={{ marginRight: 16 }}
          color={textSecondaryColor(colorScheme)}
        />
      </TouchableOpacity>
    );
  }
}
